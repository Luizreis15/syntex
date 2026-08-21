import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";

describe("control plane — gateway por tenant", () => {
  let tenantId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant("cp11");
    tenantId = tenant.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenantId);
  });

  it("atualiza default_charge_provider e campos Itaú; limpa Itaú ao voltar para stub", async () => {
    const { data: itau, error: itauError } = await admin
      .from("tenant")
      .update({
        default_charge_provider: "itau_bolecode",
        itau_beneficiario_id: "ben-1",
        itau_pix_key: "pix@example.com",
        itau_carteira_code: "109",
      })
      .eq("id", tenantId)
      .select("default_charge_provider, itau_beneficiario_id, itau_pix_key, itau_carteira_code")
      .single();
    expect(itauError).toBeNull();
    expect(itau?.default_charge_provider).toBe("itau_bolecode");
    expect(itau?.itau_beneficiario_id).toBe("ben-1");

    const { data: stub, error: stubError } = await admin
      .from("tenant")
      .update({
        default_charge_provider: "stub",
        itau_beneficiario_id: null,
        itau_pix_key: null,
        itau_carteira_code: null,
      })
      .eq("id", tenantId)
      .select("default_charge_provider, itau_beneficiario_id")
      .single();
    expect(stubError).toBeNull();
    expect(stub?.default_charge_provider).toBe("stub");
    expect(stub?.itau_beneficiario_id).toBeNull();
  });

  it("lista cobranças cross-tenant (service role) sem filtrar por um só tenant", async () => {
    const { data, error } = await admin
      .from("charge")
      .select("id, tenant_id, status")
      .limit(5);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
