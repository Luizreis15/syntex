import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, createTestUser, deleteTestTenant, unique } from "./helpers";

describe("isolamento de tenant (CLAUDE.md #1)", () => {
  let tenantA: { id: string };
  let tenantB: { id: string };
  let companyA: { id: string };
  let companyB: { id: string };
  let userA: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    tenantA = await createTestTenant("isolation-a");
    tenantB = await createTestTenant("isolation-b");

    const { data: cA, error: errorA } = await admin
      .from("company")
      .insert({ tenant_id: tenantA.id, cnpj: unique("00"), legal_name: "Empresa Tenant A" })
      .select()
      .single();
    if (errorA) throw errorA;
    companyA = cA;

    const { data: cB, error: errorB } = await admin
      .from("company")
      .insert({ tenant_id: tenantB.id, cnpj: unique("00"), legal_name: "Empresa Tenant B" })
      .select()
      .single();
    if (errorB) throw errorB;
    companyB = cB;

    userA = await createTestUser(tenantA.id, "admin", "tenant");
  });

  afterAll(async () => {
    await deleteTestTenant(tenantA.id);
    await deleteTestTenant(tenantB.id);
  });

  it("query de um tenant nunca retorna linha de outro tenant", async () => {
    const { data, error } = await userA.client.from("company").select("id, tenant_id");
    if (error) throw error;
    expect(data.every((row) => row.tenant_id === tenantA.id)).toBe(true);
    expect(data.some((row) => row.id === companyB.id)).toBe(false);
  });

  it("usuário do tenant A não consegue ler diretamente a empresa do tenant B pelo id", async () => {
    const { data } = await userA.client.from("company").select("*").eq("id", companyB.id).maybeSingle();
    expect(data).toBeNull();
  });

  it("inserir filho referenciando pai de outro tenant falha no banco (FK composta), não na aplicação", async () => {
    // service_role ignora RLS — se isto falhar mesmo assim, é a FK composta
    // barrando, exatamente a garantia que o CLAUDE.md exige.
    const { error } = await admin.from("establishment").insert({
      tenant_id: tenantA.id,
      company_id: companyB.id, // empresa pertence ao tenant B
      cnpj: unique("00"),
      kind: "matriz",
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23503"); // foreign_key_violation
  });
});
