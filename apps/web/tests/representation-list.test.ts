import { describe, expect, it } from "vitest";
import {
  composeCurrentRepresentation,
  isRepresentationActiveOnDate,
} from "@/lib/domain/compose-representation-status";
import {
  filterRepresentationListItems,
  summarizeRepresentationList,
  type RepresentationListItem,
} from "@/features/representations/data";
import { representationValidityLabel } from "@/features/representations/validity-label";
import { filterNavSections, isBuiltNavItemVisible, NAV_SECTIONS } from "@/components/layout/nav-config";
import type { UserGrant } from "@syntex/permissions";
import * as permissions from "@syntex/permissions";
import { vi } from "vitest";

function claim(
  overrides: Partial<{
    status: "reconhecida" | "reivindicada" | "disputada" | "perdida";
    validFrom: string;
    validUntil: string | null;
  }> = {},
) {
  return {
    status: overrides.status ?? ("reconhecida" as const),
    validFrom: overrides.validFrom ?? "2024-01-01",
    validUntil: overrides.validUntil ?? null,
    basis: "cnae" as const,
    evidence: "teste",
    unionRegistrationId: "reg-1",
    decidedAt: "2024-01-02T00:00:00Z",
  };
}

function item(overrides: Partial<RepresentationListItem> = {}): RepresentationListItem {
  return {
    establishmentId: overrides.establishmentId ?? "est-1",
    establishmentKind: overrides.establishmentKind ?? "matriz",
    establishmentCnpj: overrides.establishmentCnpj ?? "12345678000199",
    companyId: overrides.companyId ?? "co-1",
    companyName: overrides.companyName ?? "Empresa Alpha",
    municipalityName: overrides.municipalityName ?? "Santo André",
    municipalityId: overrides.municipalityId ?? "mun-1",
    branchId: overrides.branchId ?? "branch-1",
    status: overrides.status ?? "reconhecida",
    validFrom: "validFrom" in overrides ? (overrides.validFrom ?? null) : "2024-01-01",
    validUntil: overrides.validUntil ?? null,
    basis: "basis" in overrides ? (overrides.basis ?? null) : "cnae",
    evidence: "evidence" in overrides ? (overrides.evidence ?? null) : "ev",
    unionRegistrationId:
      "unionRegistrationId" in overrides ? (overrides.unionRegistrationId ?? null) : "reg-1",
    registryNumber: "registryNumber" in overrides ? (overrides.registryNumber ?? null) : "123",
    activeClaimsCount: overrides.activeClaimsCount ?? 1,
    hasConflict: overrides.hasConflict ?? false,
    decidedAt: overrides.decidedAt ?? null,
  };
}

describe("composeCurrentRepresentation", () => {
  it("sem rows vigentes → sem_representacao", () => {
    const result = composeCurrentRepresentation([]);
    expect(result.status).toBe("sem_representacao");
    expect(result.activeClaimsCount).toBe(0);
    expect(result.hasConflict).toBe(false);
  });

  it("uma reconhecida → reconhecida", () => {
    const result = composeCurrentRepresentation([claim({ status: "reconhecida" })]);
    expect(result.status).toBe("reconhecida");
    expect(result.basis).toBe("cnae");
    expect(result.validFrom).toBe("2024-01-01");
  });

  it("uma reivindicada → reivindicada", () => {
    expect(composeCurrentRepresentation([claim({ status: "reivindicada" })]).status).toBe(
      "reivindicada",
    );
  });

  it("uma perdida → perdida", () => {
    expect(composeCurrentRepresentation([claim({ status: "perdida" })]).status).toBe("perdida");
  });

  it("duas claims divergentes → disputada sem eleger campo de claim única", () => {
    const a = {
      ...claim({
        status: "reivindicada",
        validFrom: "2020-01-01",
        validUntil: null,
      }),
      basis: "cnae" as const,
      evidence: "claim A",
      unionRegistrationId: "reg-A",
      decidedAt: "2020-02-01T00:00:00Z",
    };
    const b = {
      ...claim({
        status: "reivindicada",
        validFrom: "2021-06-15",
        validUntil: "2028-01-01",
      }),
      basis: "carta_sindical" as const,
      evidence: "claim B",
      unionRegistrationId: "reg-B",
      decidedAt: "2021-07-01T00:00:00Z",
    };

    const composed = composeCurrentRepresentation([a, b]);
    expect(composed.status).toBe("disputada");
    expect(composed.hasConflict).toBe(true);
    expect(composed.activeClaimsCount).toBe(2);
    expect(composed.validFrom).toBeNull();
    expect(composed.validUntil).toBeNull();
    expect(composed.basis).toBeNull();
    expect(composed.evidence).toBeNull();
    expect(composed.unionRegistrationId).toBeNull();
    expect(composed.decidedAt).toBeNull();

    // ordering das rows não muda o consolidado
    const reversed = composeCurrentRepresentation([b, a]);
    expect(reversed).toEqual(composed);
  });

  it("UI de conflito não mostra vigência/base de uma claim", () => {
    const row = item({
      status: "disputada",
      hasConflict: true,
      activeClaimsCount: 2,
      validFrom: null,
      validUntil: null,
      basis: null,
      unionRegistrationId: null,
      registryNumber: null,
      decidedAt: null,
      evidence: null,
    });
    expect(representationValidityLabel(row)).toBe("2 reivindicações vigentes");
    expect(row.basis).toBeNull();
    expect(row.registryNumber).toBeNull();
  });
});

describe("isRepresentationActiveOnDate", () => {
  it("row expirada não conta", () => {
    expect(isRepresentationActiveOnDate("2020-01-01", "2020-12-31", "2026-08-23")).toBe(false);
  });

  it("row futura não conta", () => {
    expect(isRepresentationActiveOnDate("2027-01-01", null, "2026-08-23")).toBe(false);
  });

  it("row vigente conta", () => {
    expect(isRepresentationActiveOnDate("2020-01-01", null, "2026-08-23")).toBe(true);
    expect(isRepresentationActiveOnDate("2020-01-01", "2026-12-31", "2026-08-23")).toBe(true);
  });
});

describe("representation list filter/summary", () => {
  const munis = [{ id: "mun-1", slug: "santo-andre", name: "Santo André" }];

  it("métricas e tabela compartilham granularidade establishment", () => {
    const items = [
      item({ establishmentId: "m1", status: "reconhecida", establishmentKind: "matriz" }),
      item({
        establishmentId: "f1",
        status: "sem_representacao",
        establishmentKind: "filial",
        companyName: "Empresa Alpha",
        activeClaimsCount: 0,
        validFrom: null,
        basis: null,
      }),
    ];
    const summary = summarizeRepresentationList(items, "2026-08-23");
    expect(summary.total).toBe(2);
    expect(summary.byStatus.reconhecida).toBe(1);
    expect(summary.byStatus.sem_representacao).toBe(1);
  });

  it("filial pode ter status independente da matriz", () => {
    const items = [
      item({ establishmentId: "m1", status: "reconhecida", establishmentKind: "matriz" }),
      item({
        establishmentId: "f1",
        status: "reivindicada",
        establishmentKind: "filial",
        establishmentCnpj: "999",
      }),
    ];
    expect(items.map((i) => i.status)).toEqual(["reconhecida", "reivindicada"]);
  });

  it("sem representação aparece na lista filtrável", () => {
    const items = [
      item({ status: "reconhecida" }),
      item({
        establishmentId: "e2",
        status: "sem_representacao",
        activeClaimsCount: 0,
        validFrom: null,
        basis: null,
        hasConflict: false,
      }),
    ];
    const filtered = filterRepresentationListItems(items, { status: "sem_representacao" }, munis);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.status).toBe("sem_representacao");
  });

  it("filtra por status, município e q", () => {
    const items = [
      item({ companyName: "Alpha Comércio", establishmentCnpj: "11111111000111", status: "reconhecida" }),
      item({
        establishmentId: "e2",
        companyName: "Beta Ltda",
        establishmentCnpj: "22222222000122",
        status: "disputada",
        municipalityId: "mun-2",
        municipalityName: "Mauá",
      }),
    ];
    expect(filterRepresentationListItems(items, { status: "disputada" }, munis)).toHaveLength(1);
    expect(filterRepresentationListItems(items, { q: "Alpha" }, munis)).toHaveLength(1);
    expect(filterRepresentationListItems(items, { q: "22222222" }, munis)).toHaveLength(1);
    expect(filterRepresentationListItems(items, { municipio: "santo-andre" }, munis)).toHaveLength(1);
    expect(
      filterRepresentationListItems(items, { kind: "filial" }, munis),
    ).toHaveLength(0);
  });
});

describe("Representação nav", () => {
  it("Representação is built:true com href /representacao e representation.read", () => {
    const item = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.label === "Representação");
    expect(item).toBeDefined();
    expect(item?.built).toBe(true);
    if (!item || !item.built) throw new Error("expected built");
    expect(item.href).toBe("/representacao");
    expect("permission" in item && item.permission).toBe("representation.read");
  });

  it("sem representation.read não expõe o item built", () => {
    const canSpy = vi.spyOn(permissions, "can").mockImplementation((_g, permission) => {
      return permission !== "representation.read";
    });
    const grants: UserGrant[] = [{ role: "financeiro", scope: "tenant" }];
    const sections = filterNavSections(grants, "tenant-1");
    const labels = sections.flatMap((s) => s.items).filter((i) => i.built).map((i) => i.label);
    expect(labels).not.toContain("Representação");

    const item = {
      label: "Representação",
      built: true as const,
      href: "/representacao",
      permission: "representation.read" as const,
      icon: "scale" as const,
    };
    expect(isBuiltNavItemVisible(item, grants, "tenant-1")).toBe(false);
    canSpy.mockRestore();
  });

  it("atendimento com representation.read vê Representação", () => {
    const grants: UserGrant[] = [{ role: "atendimento", scope: "tenant" }];
    const sections = filterNavSections(grants, "tenant-1");
    const labels = sections.flatMap((s) => s.items).filter((i) => i.built).map((i) => i.label);
    expect(labels).toContain("Representação");
  });
});
