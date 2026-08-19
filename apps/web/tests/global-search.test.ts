import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, createTestUser, deleteTestTenant, unique } from "./helpers";
import { globalSearch } from "@/lib/domain/global-search";
import type { Session } from "@/lib/auth/session";

/**
 * DoD do prompt 02 §"Comportamento": "Command palette não retorna entidade
 * fora do escopo do usuário — teste com dois tenants e com usuário limitado
 * a uma unidade." Isolamento de tenant vem de RLS; escopo de branch vem de
 * checkPermission — os dois têm que segurar juntos.
 */
describe("busca global — nunca vaza fora do escopo (design/SYNTEX-UI.md §24)", () => {
  let tenantA: { id: string };
  let tenantB: { id: string };
  let branchSantoAndre: { id: string };
  let branchMaua: { id: string };
  let companyTenantA: { id: string; legal_name: string };
  let companyTenantB: { id: string; legal_name: string };
  let companySantoAndre: { id: string; legal_name: string };
  let companyMaua: { id: string; legal_name: string };

  beforeAll(async () => {
    tenantA = await createTestTenant("search-a");
    tenantB = await createTestTenant("search-b");

    const { data: branches, error: branchError } = await admin
      .from("branch")
      .insert([
        { tenant_id: tenantA.id, name: "Santo André" },
        { tenant_id: tenantA.id, name: "Mauá" },
      ])
      .select();
    if (branchError) throw branchError;
    branchSantoAndre = branches.find((b) => b.name === "Santo André")!;
    branchMaua = branches.find((b) => b.name === "Mauá")!;

    // Sem dígitos de propósito: globalSearch trata query com 3+ dígitos como
    // busca por CNPJ, não por razão social — um marcador só com letras
    // evita esse desvio. Isolamento entre execuções vem do tenant, que é
    // sempre novo (createTestTenant), não do nome ser globalmente único.
    const uniqueName = "BuscaGlobalTeste";
    const { data: cA, error: eA } = await admin
      .from("company")
      .insert({ tenant_id: tenantA.id, cnpj: unique("00"), legal_name: `${uniqueName} Tenant A` })
      .select()
      .single();
    if (eA) throw eA;
    companyTenantA = cA;

    const { data: cB, error: eB } = await admin
      .from("company")
      .insert({ tenant_id: tenantB.id, cnpj: unique("00"), legal_name: `${uniqueName} Tenant B` })
      .select()
      .single();
    if (eB) throw eB;
    companyTenantB = cB;

    const { data: cSA, error: eSA } = await admin
      .from("company")
      .insert({
        tenant_id: tenantA.id,
        branch_id: branchSantoAndre.id,
        cnpj: unique("00"),
        legal_name: `${uniqueName} Santo Andre`,
      })
      .select()
      .single();
    if (eSA) throw eSA;
    companySantoAndre = cSA;

    const { data: cM, error: eM } = await admin
      .from("company")
      .insert({
        tenant_id: tenantA.id,
        branch_id: branchMaua.id,
        cnpj: unique("00"),
        legal_name: `${uniqueName} Maua`,
      })
      .select()
      .single();
    if (eM) throw eM;
    companyMaua = cM;
  });

  afterAll(async () => {
    await deleteTestTenant(tenantA.id);
    await deleteTestTenant(tenantB.id);
  });

  it("busca no tenant A nunca retorna empresa do tenant B", async () => {
    const userA = await createTestUser(tenantA.id, "admin", "tenant");
    const session = {
      supabase: userA.client,
      tenantId: tenantA.id,
      appUserId: userA.appUserId,
      authUserId: userA.authUserId,
      grants: [{ role: "admin" as const, scope: "tenant" as const }],
    } as unknown as Session;

    const result = await globalSearch(session, companyTenantA.legal_name.split(" ")[0]!);
    const labels = result.companies.map((c) => c.label);

    expect(labels).toContain(companyTenantA.legal_name);
    expect(labels).not.toContain(companyTenantB.legal_name);
  });

  it("usuário limitado a uma unidade só vê empresas daquela unidade", async () => {
    const atendimentoMaua = await createTestUser(tenantA.id, "atendimento", "branch", branchMaua.id);
    const session = {
      supabase: atendimentoMaua.client,
      tenantId: tenantA.id,
      appUserId: atendimentoMaua.appUserId,
      authUserId: atendimentoMaua.authUserId,
      grants: [{ role: "atendimento" as const, scope: "branch" as const, branchId: branchMaua.id }],
    } as unknown as Session;

    const query = companySantoAndre.legal_name.split(" ").slice(0, 2).join(" ");
    const result = await globalSearch(session, query);
    const labels = result.companies.map((c) => c.label);

    expect(labels).not.toContain(companySantoAndre.legal_name);

    const resultOwnBranch = await globalSearch(session, companyMaua.legal_name.split(" ")[0]!);
    expect(resultOwnBranch.companies.map((c) => c.label)).toContain(companyMaua.legal_name);
  });
});
