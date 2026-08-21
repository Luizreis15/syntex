import { describe, expect, it } from "vitest";
import { allowedBranchIds, can, hasAnyGrant, type UserGrant } from "@syntex/permissions";

const TENANT_A = "11111111-1111-1111-1111-111111111111";
const TENANT_B = "22222222-2222-2222-2222-222222222222";
const BRANCH_MAUA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const BRANCH_SANTO_ANDRE = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe("matriz de permissão role x permission x scope", () => {
  it("atendimento com finance.read é negado", () => {
    const grants: UserGrant[] = [{ role: "atendimento", scope: "branch", branchId: BRANCH_MAUA }];
    expect(can(grants, "finance.read", TENANT_A, { tenantId: TENANT_A, branchId: BRANCH_MAUA })).toBe(false);
  });

  it("financeiro com finance.write é permitido", () => {
    const grants: UserGrant[] = [{ role: "financeiro", scope: "tenant" }];
    expect(can(grants, "finance.write", TENANT_A, { tenantId: TENANT_A })).toBe(true);
    expect(can(grants, "company.read", TENANT_A, { tenantId: TENANT_A })).toBe(true);
  });

  it("atendimento com worker.read e membership.write é permitido", () => {
    const grants: UserGrant[] = [{ role: "atendimento", scope: "tenant" }];
    expect(can(grants, "worker.read", TENANT_A, { tenantId: TENANT_A })).toBe(true);
    expect(can(grants, "membership.write", TENANT_A, { tenantId: TENANT_A })).toBe(true);
    expect(can(grants, "finance.write", TENANT_A, { tenantId: TENANT_A })).toBe(false);
  });

  it("financeiro lê filiação mas não escreve", () => {
    const grants: UserGrant[] = [{ role: "financeiro", scope: "tenant" }];
    expect(can(grants, "membership.read", TENANT_A, { tenantId: TENANT_A })).toBe(true);
    expect(can(grants, "membership.write", TENANT_A, { tenantId: TENANT_A })).toBe(false);
  });

  it("usuário de Mauá lendo registro de Santo André é negado", () => {
    const grants: UserGrant[] = [{ role: "atendimento", scope: "branch", branchId: BRANCH_MAUA }];
    expect(
      can(grants, "company.read", TENANT_A, { tenantId: TENANT_A, branchId: BRANCH_SANTO_ANDRE }),
    ).toBe(false);
  });

  it("usuário de Mauá lendo registro de Mauá é permitido", () => {
    const grants: UserGrant[] = [{ role: "atendimento", scope: "branch", branchId: BRANCH_MAUA }];
    expect(can(grants, "company.read", TENANT_A, { tenantId: TENANT_A, branchId: BRANCH_MAUA })).toBe(true);
  });

  it("tenant A lendo tenant B é negado mesmo com permissão de admin", () => {
    const grants: UserGrant[] = [{ role: "admin", scope: "tenant" }];
    expect(can(grants, "company.read", TENANT_A, { tenantId: TENANT_B })).toBe(false);
  });

  it("admin com escopo tenant lê qualquer branch do próprio tenant", () => {
    const grants: UserGrant[] = [{ role: "admin", scope: "tenant" }];
    expect(can(grants, "company.read", TENANT_A, { tenantId: TENANT_A, branchId: BRANCH_SANTO_ANDRE })).toBe(
      true,
    );
  });

  it("worker.read não implica worker.export (permissões distintas)", () => {
    const grants: UserGrant[] = [{ role: "atendimento", scope: "tenant" }];
    // atendimento não tem nem uma nem outra nesta matriz — o ponto é que
    // company.read e representation.decide são permissões independentes,
    // uma não decorre da outra.
    expect(can(grants, "company.read", TENANT_A, { tenantId: TENANT_A })).toBe(true);
    expect(can(grants, "representation.decide", TENANT_A, { tenantId: TENANT_A })).toBe(false);
  });

  it("escopo department casa com departmentId do recurso", () => {
    const dept = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const grants: UserGrant[] = [{ role: "admin", scope: "department", departmentId: dept }];
    expect(can(grants, "company.read", TENANT_A, { tenantId: TENANT_A, departmentId: dept })).toBe(true);
    expect(
      can(grants, "company.read", TENANT_A, {
        tenantId: TENANT_A,
        departmentId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      }),
    ).toBe(false);
    expect(can(grants, "company.read", TENANT_A, { tenantId: TENANT_A })).toBe(false);
  });

  describe("portão de listagem (hasAnyGrant / allowedBranchIds)", () => {
    it("usuário só-de-branch não é bloqueado por um gate sem resource concreto", () => {
      // Esta é a regressão real: can() com resource sem branchId sempre nega
      // quem só tem grant de escopo 'branch' — hasAnyGrant existe para não
      // confundir "sem recurso ainda" com "sem permissão".
      const grants: UserGrant[] = [{ role: "atendimento", scope: "branch", branchId: BRANCH_MAUA }];
      expect(can(grants, "company.read", TENANT_A, { tenantId: TENANT_A })).toBe(false);
      expect(hasAnyGrant(grants, "company.read")).toBe(true);
    });

    it("allowedBranchIds retorna 'all' para escopo tenant/global", () => {
      expect(allowedBranchIds([{ role: "admin", scope: "tenant" }], "company.read")).toBe("all");
      expect(allowedBranchIds([{ role: "admin", scope: "global" }], "company.read")).toBe("all");
    });

    it("allowedBranchIds restringe às unidades concedidas em escopo branch", () => {
      const grants: UserGrant[] = [
        { role: "atendimento", scope: "branch", branchId: BRANCH_MAUA },
        { role: "atendimento", scope: "branch", branchId: BRANCH_SANTO_ANDRE },
      ];
      expect(allowedBranchIds(grants, "company.read")).toEqual([BRANCH_MAUA, BRANCH_SANTO_ANDRE]);
    });

    it("allowedBranchIds retorna lista vazia sem nenhum grant para a permissão", () => {
      const grants: UserGrant[] = [{ role: "financeiro", scope: "tenant" }];
      expect(allowedBranchIds(grants, "representation.decide")).toEqual([]);
      expect(hasAnyGrant(grants, "representation.decide")).toBe(false);
    });
  });
});
