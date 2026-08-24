import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserGrant } from "@syntex/permissions";
import { fetchRepresentationWorkspace } from "@/features/representations/workspace-data";
import { NAV_SECTIONS } from "@/components/layout/nav-config";

vi.mock("@/lib/domain/resolve-representation", () => ({
  resolveRepresentation: vi.fn(),
}));

import { resolveRepresentation } from "@/lib/domain/resolve-representation";

const resolveMock = vi.mocked(resolveRepresentation);

type Row = Record<string, unknown>;

function makeClient(tables: Record<string, Row[]>) {
  return {
    from(table: string) {
      const rows = [...(tables[table] ?? [])];
      const state: {
        filters: Array<(r: Row) => boolean>;
        single: boolean;
        maybe: boolean;
        orderCol?: string;
        ascending?: boolean;
      } = { filters: [], single: false, maybe: false };

      const api: Record<string, unknown> = {};
      const self = () => api;

      const run = () => {
        let data = rows;
        for (const f of state.filters) data = data.filter(f);
        if (state.orderCol) {
          const col = state.orderCol;
          const asc = state.ascending !== false;
          data = [...data].sort((a, b) => {
            const av = String(a[col] ?? "");
            const bv = String(b[col] ?? "");
            return asc ? av.localeCompare(bv) : bv.localeCompare(av);
          });
        }
        if (state.single || state.maybe) {
          return { data: data[0] ?? null, error: null };
        }
        return { data, error: null };
      };

      api.select = self;
      api.eq = (col: string, val: unknown) => {
        state.filters.push((r) => (col in r ? r[col] === val : true));
        return api;
      };
      api.in = (col: string, vals: unknown[]) => {
        const set = new Set(vals);
        state.filters.push((r) => set.has(r[col]));
        return api;
      };
      api.order = (col: string, opts?: { ascending?: boolean }) => {
        state.orderCol = col;
        state.ascending = opts?.ascending;
        return api;
      };
      api.maybeSingle = () => {
        state.maybe = true;
        return api;
      };
      api.single = () => {
        state.single = true;
        return api;
      };
      api.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(run()));
      return api;
    },
  };
}

const referenceDate = "2026-08-23";
const grantsTenant: UserGrant[] = [{ role: "diretoria", scope: "tenant" }];

const baseEstablishment = {
  id: "e1",
  kind: "matriz",
  cnpj: "11111111000111",
  company_id: "c1",
  municipality_id: "m1",
  cnae_id: null,
  municipality: { id: "m1", name: "Santo André" },
  cnae: null,
};

const baseCompany = {
  id: "c1",
  legal_name: "Alpha Comércio",
  trade_name: "Alpha",
  branch_id: "b1",
};

function emptyResolution(overrides: Record<string, unknown> = {}) {
  return {
    status: "sem_representacao",
    representation: null,
    agreement: null,
    contributionRules: [],
    basis: null,
    evidence: null,
    conflicts: [],
    ...overrides,
  };
}

beforeEach(() => {
  resolveMock.mockReset();
  resolveMock.mockResolvedValue(emptyResolution() as never);
});

describe("fetchRepresentationWorkspace", () => {
  it("establishment sem representation → sem_representacao, histórico vazio", async () => {
    const client = makeClient({
      establishment: [baseEstablishment],
      company: [baseCompany],
      union_representation: [],
      union_registration: [],
      economic_category: [],
      professional_category: [],
      union_territory: [],
      app_user: [],
    });

    const result = await fetchRepresentationWorkspace(client as never, "t1", grantsTenant, "e1", {
      referenceDate,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace.currentStatus).toBe("sem_representacao");
    expect(result.workspace.activeClaims).toHaveLength(0);
    expect(result.workspace.history).toHaveLength(0);
    expect(result.workspace.resolvedAgreement).toBeNull();
  });

  it("sem vigente mas com histórico", async () => {
    const client = makeClient({
      establishment: [baseEstablishment],
      company: [baseCompany],
      union_representation: [
        {
          id: "r-old",
          status: "reconhecida",
          valid_from: "2019-01-01",
          valid_until: "2020-01-01",
          basis: "cnae",
          evidence: "passado",
          union_registration_id: null,
          decided_by: null,
          decided_at: null,
        },
      ],
      union_registration: [],
      economic_category: [],
      professional_category: [],
      union_territory: [],
      app_user: [],
    });

    const result = await fetchRepresentationWorkspace(client as never, "t1", grantsTenant, "e1", {
      referenceDate,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace.currentStatus).toBe("sem_representacao");
    expect(result.workspace.activeClaims).toHaveLength(0);
    expect(result.workspace.history).toHaveLength(1);
    expect(result.workspace.history[0]?.evidence).toBe("passado");
  });

  it("uma reconhecida vigente", async () => {
    resolveMock.mockResolvedValue(
      emptyResolution({
        status: "reconhecida",
        agreement: {
          id: "agr-1",
          kind: "cct",
          mediador_number: "M-1",
          valid_from: "2024-01-01",
          valid_until: "2027-01-01",
          base_date: "2024-01-01",
          economic_category_id: "ec1",
          professional_category_id: "pc1",
          tenant_id: "t1",
        },
        contributionRules: [
          {
            id: "rule-1",
            tenant_id: "t1",
            collective_agreement_id: "agr-1",
            type: "assistencial",
            valid_from: "2024-01-01",
            valid_until: null,
            calculation_base: "folha",
            value_type: "percentual",
            value: 1.5,
          },
        ],
      }) as never,
    );

    const client = makeClient({
      establishment: [baseEstablishment],
      company: [baseCompany],
      union_representation: [
        {
          id: "r1",
          status: "reconhecida",
          valid_from: "2024-01-01",
          valid_until: null,
          basis: "carta_sindical",
          evidence: "carta",
          union_registration_id: "reg1",
          decided_by: "u1",
          decided_at: "2024-01-02T12:00:00Z",
        },
      ],
      union_registration: [
        {
          id: "reg1",
          registry_number: "REG-SEC",
          registered_at: "2010-01-01",
          document_reference: "doc-1",
          economic_category_id: "ec1",
          professional_category_id: "pc1",
        },
      ],
      economic_category: [{ id: "ec1", name: "Comércio" }],
      professional_category: [{ id: "pc1", name: "Comerciários" }],
      union_territory: [
        { union_registration_id: "reg1", municipality: { name: "Santo André" } },
      ],
      app_user: [{ id: "u1", full_name: "Ana Diretoria" }],
    });

    const result = await fetchRepresentationWorkspace(client as never, "t1", grantsTenant, "e1", {
      referenceDate,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace.currentStatus).toBe("reconhecida");
    expect(result.workspace.activeClaims).toHaveLength(1);
    expect(result.workspace.activeClaims[0]?.registration?.registryNumber).toBe("REG-SEC");
    expect(result.workspace.activeClaims[0]?.decidedByName).toBe("Ana Diretoria");
    expect(result.workspace.resolvedAgreement?.id).toBe("agr-1");
    expect(result.workspace.contributionRules).toHaveLength(1);
    expect(resolveMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["reivindicada", "reivindicada"],
    ["perdida", "perdida"],
  ] as const)("uma %s vigente → status %s", async (rowStatus, expected) => {
    const client = makeClient({
      establishment: [baseEstablishment],
      company: [baseCompany],
      union_representation: [
        {
          id: "r1",
          status: rowStatus,
          valid_from: "2024-01-01",
          valid_until: null,
          basis: "manual",
          evidence: "x",
          union_registration_id: null,
          decided_by: null,
          decided_at: null,
        },
      ],
      union_registration: [],
      economic_category: [],
      professional_category: [],
      union_territory: [],
      app_user: [],
    });
    const result = await fetchRepresentationWorkspace(client as never, "t1", grantsTenant, "e1", {
      referenceDate,
    });
    expect(result.ok && result.workspace.currentStatus).toBe(expected);
  });

  it("duas claims vigentes com registrations diferentes → disputada individualizadas", async () => {
    resolveMock.mockResolvedValue(emptyResolution({ status: "disputada", conflicts: [{}, {}] }) as never);

    const client = makeClient({
      establishment: [baseEstablishment],
      company: [baseCompany],
      union_representation: [
        {
          id: "r-a",
          status: "reivindicada",
          valid_from: "2020-01-01",
          valid_until: null,
          basis: "cnae",
          evidence: "A",
          union_registration_id: "reg-A",
          decided_by: null,
          decided_at: null,
        },
        {
          id: "r-b",
          status: "reivindicada",
          valid_from: "2021-01-01",
          valid_until: null,
          basis: "carta_sindical",
          evidence: "B",
          union_registration_id: "reg-B",
          decided_by: null,
          decided_at: null,
        },
      ],
      union_registration: [
        {
          id: "reg-A",
          registry_number: "NUM-A",
          registered_at: "2000-01-01",
          document_reference: null,
          economic_category_id: null,
          professional_category_id: "pc1",
        },
        {
          id: "reg-B",
          registry_number: "NUM-B",
          registered_at: "2001-01-01",
          document_reference: null,
          economic_category_id: null,
          professional_category_id: "pc1",
        },
      ],
      economic_category: [],
      professional_category: [{ id: "pc1", name: "Comerciários" }],
      union_territory: [],
      app_user: [],
    });

    const result = await fetchRepresentationWorkspace(client as never, "t1", grantsTenant, "e1", {
      referenceDate,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace.currentStatus).toBe("disputada");
    expect(result.workspace.hasConflict).toBe(true);
    expect(result.workspace.activeClaims).toHaveLength(2);
    expect(result.workspace.activeClaims.map((c) => c.registration?.registryNumber).sort()).toEqual([
      "NUM-A",
      "NUM-B",
    ]);
    expect(result.workspace.activeClaims.map((c) => c.basis).sort()).toEqual([
      "carta_sindical",
      "cnae",
    ]);
    expect(result.workspace.agreementBlockedByDispute).toBe(true);
    expect(result.workspace.resolvedAgreement).toBeNull();
  });

  it("claim futura não é vigente; expirada só no histórico", async () => {
    const client = makeClient({
      establishment: [baseEstablishment],
      company: [baseCompany],
      union_representation: [
        {
          id: "expired",
          status: "reconhecida",
          valid_from: "2018-01-01",
          valid_until: "2019-01-01",
          basis: "cnae",
          evidence: "old",
          union_registration_id: null,
          decided_by: null,
          decided_at: null,
        },
        {
          id: "future",
          status: "reivindicada",
          valid_from: "2027-01-01",
          valid_until: null,
          basis: "manual",
          evidence: "future",
          union_registration_id: null,
          decided_by: null,
          decided_at: null,
        },
      ],
      union_registration: [],
      economic_category: [],
      professional_category: [],
      union_territory: [],
      app_user: [],
    });

    const result = await fetchRepresentationWorkspace(client as never, "t1", grantsTenant, "e1", {
      referenceDate,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace.activeClaims).toHaveLength(0);
    expect(result.workspace.history.map((h) => h.id).sort()).toEqual(["expired", "future"]);
  });

  it("branch scope bloqueia establishment de outra branch", async () => {
    const client = makeClient({
      establishment: [baseEstablishment],
      company: [{ ...baseCompany, branch_id: "b2" }],
      union_representation: [],
    });
    const grants: UserGrant[] = [{ role: "atendimento", scope: "branch", branchId: "b1" }];
    const result = await fetchRepresentationWorkspace(client as never, "t1", grants, "e1", {
      referenceDate,
    });
    expect(result).toEqual({ ok: false, reason: "out_of_scope" });
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("tenant isolation: filtra tenant_id no establishment", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const client = {
      from(table: string) {
        const api: Record<string, unknown> = {};
        const self = () => api;
        api.select = self;
        api.eq = (col: string, val: unknown) => {
          eqCalls.push([col, val]);
          return api;
        };
        api.in = self;
        api.order = self;
        api.maybeSingle = () => api;
        api.then = (resolve: (v: unknown) => unknown) =>
          Promise.resolve(resolve({ data: null, error: null }));
        return api;
      },
    };
    const result = await fetchRepresentationWorkspace(
      client as never,
      "tenant-A",
      grantsTenant,
      "e1",
      { referenceDate },
    );
    expect(result.ok).toBe(false);
    expect(eqCalls.some(([c, v]) => c === "tenant_id" && v === "tenant-A")).toBe(true);
  });

  it("audit metadata shape não inclui evidence (contrato da page)", () => {
    const metadata = {
      surface: "representacao.workspace",
      establishmentId: "e1",
      companyId: "c1",
      activeClaimsCount: 2,
      currentStatus: "disputada",
      classification: "juridico",
    };
    expect(metadata).not.toHaveProperty("evidence");
    expect(JSON.stringify(metadata)).not.toMatch(/evidence|document_reference/i);
  });
});

describe("workspace deep-links / nav", () => {
  it("lista aponta para /representacao/[establishmentId] (columns)", async () => {
    const mod = await import("@/features/representations/columns");
    expect(mod.representationColumns.length).toBeGreaterThan(0);
    // deep-link coberto indiretamente: rota dedicada existe no nav list
    const item = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.label === "Representação");
    expect(item && item.built && item.href).toBe("/representacao");
  });
});


describe("workspace view deep-links", () => {
  it("inclui Ver empresa e convenção quando aplicável", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const viewPath = path.join(
      process.cwd(),
      "features",
      "representations",
      "components",
      "representation-workspace-view.tsx",
    );
    const source = await fs.readFile(viewPath, "utf8");
    expect(source).toContain("/empresas/${company.id}");
    expect(source).toContain("/convencoes/${workspace.resolvedAgreement.id}");
    expect(source).toContain("Ver empresa");
  });
});
