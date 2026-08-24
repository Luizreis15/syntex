import { describe, expect, it, vi } from "vitest";
import { fetchRepresentationListItems } from "@/features/representations/data";
import type { UserGrant } from "@syntex/permissions";

type Row = Record<string, unknown>;

function makeClient(tables: Record<string, Row[]>) {
  return {
    from(table: string) {
      const rows = tables[table] ?? [];
      const state: { filters: Array<(r: Row) => boolean> } = { filters: [] };

      const api: Record<string, unknown> = {};
      const self = () => api;

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
      api.order = self;
      api.then = (resolve: (v: unknown) => unknown) => {
        let data = rows;
        for (const f of state.filters) data = data.filter(f);
        return Promise.resolve(resolve({ data, error: null }));
      };

      return api;
    },
  };
}

describe("fetchRepresentationListItems set-based", () => {
  const referenceDate = "2026-08-23";

  it("parte de establishments e inclui sem representação", async () => {
    const client = makeClient({
      company: [
        { id: "c1", legal_name: "Alpha", trade_name: null, branch_id: "b1" },
      ],
      establishment: [
        {
          id: "e1",
          kind: "matriz",
          cnpj: "111",
          company_id: "c1",
          municipality_id: "m1",
          municipality: { id: "m1", name: "Santo André" },
        },
        {
          id: "e2",
          kind: "filial",
          cnpj: "222",
          company_id: "c1",
          municipality_id: "m1",
          municipality: { id: "m1", name: "Santo André" },
        },
      ],
      union_representation: [
        {
          establishment_id: "e1",
          status: "reconhecida",
          valid_from: "2020-01-01",
          valid_until: null,
          basis: "cnae",
          evidence: "ok",
          union_registration_id: "r1",
          decided_at: null,
        },
      ],
      union_registration: [{ id: "r1", registry_number: "REG-1" }],
    });

    const grants: UserGrant[] = [{ role: "diretoria", scope: "tenant" }];
    const { items } = await fetchRepresentationListItems(client as never, "t1", grants, {
      referenceDate,
    });

    expect(items).toHaveLength(2);
    const matriz = items.find((i) => i.establishmentId === "e1");
    const filial = items.find((i) => i.establishmentId === "e2");
    expect(matriz?.status).toBe("reconhecida");
    expect(matriz?.registryNumber).toBe("REG-1");
    expect(filial?.status).toBe("sem_representacao");
  });

  it("duas vigentes divergentes → disputada sem eleger claim (ordering-independent)", async () => {
    const rowsForward = [
      {
        establishment_id: "e1",
        status: "reivindicada",
        valid_from: "2020-01-01",
        valid_until: null,
        basis: "cnae",
        evidence: "a",
        union_registration_id: "reg-A",
        decided_at: "2020-02-01T00:00:00Z",
      },
      {
        establishment_id: "e1",
        status: "reivindicada",
        valid_from: "2022-03-01",
        valid_until: "2029-01-01",
        basis: "carta_sindical",
        evidence: "b",
        union_registration_id: "reg-B",
        decided_at: "2022-04-01T00:00:00Z",
      },
    ];

    async function run(reps: typeof rowsForward) {
      const client = makeClient({
        company: [{ id: "c1", legal_name: "Beta", trade_name: null, branch_id: "b1" }],
        establishment: [
          {
            id: "e1",
            kind: "matriz",
            cnpj: "111",
            company_id: "c1",
            municipality_id: null,
            municipality: null,
          },
        ],
        union_representation: reps,
        union_registration: [
          { id: "reg-A", registry_number: "NUM-A" },
          { id: "reg-B", registry_number: "NUM-B" },
        ],
      });
      const { items } = await fetchRepresentationListItems(
        client as never,
        "t1",
        [{ role: "admin", scope: "tenant" }],
        { referenceDate },
      );
      return items[0]!;
    }

    const forward = await run(rowsForward);
    const reversed = await run([...rowsForward].reverse());

    for (const row of [forward, reversed]) {
      expect(row.status).toBe("disputada");
      expect(row.hasConflict).toBe(true);
      expect(row.activeClaimsCount).toBe(2);
      expect(row.validFrom).toBeNull();
      expect(row.validUntil).toBeNull();
      expect(row.basis).toBeNull();
      expect(row.evidence).toBeNull();
      expect(row.unionRegistrationId).toBeNull();
      expect(row.registryNumber).toBeNull();
      expect(row.decidedAt).toBeNull();
    }

    expect(forward).toEqual(reversed);
  });

  it("ignora row expirada e futura", async () => {
    const client = makeClient({
      company: [{ id: "c1", legal_name: "Gama", trade_name: null, branch_id: "b1" }],
      establishment: [
        {
          id: "e1",
          kind: "matriz",
          cnpj: "111",
          company_id: "c1",
          municipality_id: null,
          municipality: null,
        },
      ],
      union_representation: [
        {
          establishment_id: "e1",
          status: "reconhecida",
          valid_from: "2019-01-01",
          valid_until: "2020-01-01",
          basis: "cnae",
          evidence: "expirada",
          union_registration_id: null,
          decided_at: null,
        },
        {
          establishment_id: "e1",
          status: "reivindicada",
          valid_from: "2027-01-01",
          valid_until: null,
          basis: "manual",
          evidence: "futura",
          union_registration_id: null,
          decided_at: null,
        },
      ],
      union_registration: [],
    });

    const { items } = await fetchRepresentationListItems(
      client as never,
      "t1",
      [{ role: "admin", scope: "tenant" }],
      { referenceDate },
    );
    expect(items[0]?.status).toBe("sem_representacao");
  });

  it("branch scope não inclui company de outra branch", async () => {
    const client = makeClient({
      company: [
        { id: "c1", legal_name: "Na branch", trade_name: null, branch_id: "b1" },
        { id: "c2", legal_name: "Outra branch", trade_name: null, branch_id: "b2" },
      ],
      establishment: [
        {
          id: "e1",
          kind: "matriz",
          cnpj: "111",
          company_id: "c1",
          municipality_id: null,
          municipality: null,
        },
        {
          id: "e2",
          kind: "matriz",
          cnpj: "222",
          company_id: "c2",
          municipality_id: null,
          municipality: null,
        },
      ],
      union_representation: [],
      union_registration: [],
    });

    const grants: UserGrant[] = [
      { role: "atendimento", scope: "branch", branchId: "b1" },
    ];
    const { items } = await fetchRepresentationListItems(client as never, "t1", grants, {
      referenceDate,
    });
    expect(items.map((i) => i.companyId)).toEqual(["c1"]);
  });

  it("tenant isolation: query sempre filtra tenant_id", async () => {
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
        api.then = (resolve: (v: unknown) => unknown) =>
          Promise.resolve(resolve({ data: table === "company" ? [] : [], error: null }));
        return api;
      },
    };

    await fetchRepresentationListItems(
      client as never,
      "tenant-A",
      [{ role: "admin", scope: "tenant" }],
      { referenceDate },
    );
    expect(eqCalls.some(([col, val]) => col === "tenant_id" && val === "tenant-A")).toBe(true);
  });
});
