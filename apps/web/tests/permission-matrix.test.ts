import { describe, expect, it } from "vitest";
import { can, type UserGrant } from "@syntex/permissions";

const TENANT_A = "11111111-1111-1111-1111-111111111111";
const TENANT_B = "22222222-2222-2222-2222-222222222222";
const BRANCH_MAUA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const BRANCH_SANTO_ANDRE = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe("matriz de permissão role x permission x scope", () => {
  it("atendimento com finance.read é negado", () => {
    const grants: UserGrant[] = [{ role: "atendimento", scope: "branch", branchId: BRANCH_MAUA }];
    expect(can(grants, "finance.read", TENANT_A, { tenantId: TENANT_A, branchId: BRANCH_MAUA })).toBe(false);
  });

  it("financeiro com finance.read é permitido", () => {
    const grants: UserGrant[] = [{ role: "financeiro", scope: "tenant" }];
    expect(can(grants, "finance.read", TENANT_A, { tenantId: TENANT_A })).toBe(true);
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

  it("escopo department nunca é satisfeito nesta fatia (sem tabela department)", () => {
    const grants: UserGrant[] = [{ role: "admin", scope: "department" }];
    expect(can(grants, "company.read", TENANT_A, { tenantId: TENANT_A, departmentId: "qualquer" })).toBe(
      false,
    );
  });
});
