import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";

describe("resolução de representação (Union Domain)", () => {
  let tenant: { id: string };

  beforeAll(async () => {
    tenant = await createTestTenant("domain");
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("estabelecimento com duas representações concorrentes retorna disputada e ambas em conflicts", async () => {
    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Disputada" })
      .select()
      .single();
    if (companyError) throw companyError;

    const { data: establishment, error: establishmentError } = await admin
      .from("establishment")
      .insert({ tenant_id: tenant.id, company_id: company.id, cnpj: unique("00"), kind: "matriz" })
      .select()
      .single();
    if (establishmentError) throw establishmentError;

    const rows = [
      { evidence: "reivindicação A", basis: "cnae" as const },
      { evidence: "reivindicação B (rival)", basis: "carta_sindical" as const },
    ];
    for (const row of rows) {
      const { error } = await admin.from("union_representation").insert({
        tenant_id: tenant.id,
        establishment_id: establishment.id,
        status: "reivindicada",
        valid_from: "2025-01-01",
        valid_until: null,
        basis: row.basis,
        evidence: row.evidence,
      });
      if (error) throw error;
    }

    const result = await resolveRepresentation(admin, tenant.id, establishment.id, "2025-06-01");
    expect(result.status).toBe("disputada");
    expect(result.representation).toBeNull();
    expect(result.conflicts).toHaveLength(2);
    expect(result.conflicts.map((c) => c.evidence).sort()).toEqual(
      ["reivindicação A", "reivindicação B (rival)"].sort(),
    );
  });

  it("matriz e filial em municípios diferentes resolvem para representações diferentes", async () => {
    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Multi-Estabelecimento" })
      .select()
      .single();
    if (companyError) throw companyError;

    const { data: matriz, error: matrizError } = await admin
      .from("establishment")
      .insert({ tenant_id: tenant.id, company_id: company.id, cnpj: unique("00"), kind: "matriz" })
      .select()
      .single();
    if (matrizError) throw matrizError;

    const { data: filial, error: filialError } = await admin
      .from("establishment")
      .insert({ tenant_id: tenant.id, company_id: company.id, cnpj: unique("00"), kind: "filial" })
      .select()
      .single();
    if (filialError) throw filialError;

    const { error: matrizRepError } = await admin.from("union_representation").insert({
      tenant_id: tenant.id,
      establishment_id: matriz.id,
      status: "reconhecida",
      valid_from: "2020-01-01",
      valid_until: null,
      basis: "manual",
      evidence: "representação da matriz",
    });
    if (matrizRepError) throw matrizRepError;

    // A filial não tem nenhuma representação própria cadastrada.

    const matrizResolution = await resolveRepresentation(admin, tenant.id, matriz.id, "2025-01-01");
    const filialResolution = await resolveRepresentation(admin, tenant.id, filial.id, "2025-01-01");

    expect(matrizResolution.status).toBe("reconhecida");
    expect(matrizResolution.representation?.evidence).toBe("representação da matriz");
    expect(filialResolution.status).toBe("sem_representacao");
  });
});
