import { describe, expect, it, vi } from "vitest";
import type { UserGrant } from "@syntex/permissions";
import { fetchEmpresa360RepresentationBlock } from "@/features/companies/empresa-360-representation";

vi.mock("@/lib/domain/resolve-representation", () => ({
  resolveRepresentation: vi.fn(async () => ({
    status: "reconhecida",
    representation: { id: "rep-1", evidence: "secreto" },
    agreement: { id: "agr-1" },
    contributionRules: [{ id: "rule-1" }],
    basis: "manual",
    evidence: "secreto",
    conflicts: [],
  })),
}));

import { resolveRepresentation } from "@/lib/domain/resolve-representation";

const resolveMock = vi.mocked(resolveRepresentation);

describe("Empresa 360 — segregação representation.read", () => {
  it("company.read sem representation.read → não consulta dado jurídico", async () => {
    const from = vi.fn(() => {
      throw new Error("union_representation não deve ser consultada");
    });
    const grants: UserGrant[] = [{ role: "financeiro", scope: "tenant" }];

    const block = await fetchEmpresa360RepresentationBlock(
      { from } as never,
      "t1",
      grants,
      "matriz-1",
      "2026-08-23",
    );

    expect(block).toBeNull();
    expect(from).not.toHaveBeenCalled();
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("representation.read → resolve + timeline são carregados", async () => {
    resolveMock.mockClear();
    const order = vi.fn(() => ({
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve(
          resolve({
            data: [
              {
                id: "r1",
                status: "reconhecida",
                basis: "manual",
                valid_from: "2024-01-01",
                valid_until: null,
                evidence: "ok",
              },
            ],
            error: null,
          }),
        ),
    }));
    const eq2 = vi.fn(() => ({ order }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const select = vi.fn(() => ({ eq: eq1 }));
    const from = vi.fn((table: string) => {
      expect(table).toBe("union_representation");
      return { select };
    });

    const grants: UserGrant[] = [{ role: "atendimento", scope: "tenant" }];
    const block = await fetchEmpresa360RepresentationBlock(
      { from } as never,
      "t1",
      grants,
      "matriz-1",
      "2026-08-23",
    );

    expect(block).not.toBeNull();
    expect(resolveMock).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("union_representation");
    expect(block?.resolution?.status).toBe("reconhecida");
    expect(block?.timeline).toHaveLength(1);
  });

  it("financeiro (company.read) não tem representation.read na matrix", async () => {
    const { hasAnyGrant, ROLE_PERMISSIONS } = await import("@syntex/permissions");
    expect(ROLE_PERMISSIONS.financeiro).toContain("company.read");
    expect(ROLE_PERMISSIONS.financeiro).not.toContain("representation.read");
    expect(hasAnyGrant([{ role: "financeiro", scope: "tenant" }], "representation.read")).toBe(
      false,
    );
    expect(hasAnyGrant([{ role: "atendimento", scope: "tenant" }], "representation.read")).toBe(
      true,
    );
  });
});
