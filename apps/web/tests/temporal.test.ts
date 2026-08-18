import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";

describe("vigência temporal (CLAUDE.md #3)", () => {
  let tenant: { id: string };
  let establishmentId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("temporal");
    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Temporal" })
      .select()
      .single();
    if (companyError) throw companyError;

    const { data: establishment, error: establishmentError } = await admin
      .from("establishment")
      .insert({ tenant_id: tenant.id, company_id: company.id, cnpj: unique("00"), kind: "matriz" })
      .select()
      .single();
    if (establishmentError) throw establishmentError;
    establishmentId = establishment.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("rejeita duas representações RECONHECIDAS sobrepostas para o mesmo estabelecimento", async () => {
    const { error: firstError } = await admin.from("union_representation").insert({
      tenant_id: tenant.id,
      establishment_id: establishmentId,
      status: "reconhecida",
      valid_from: "2020-01-01",
      valid_until: "2022-12-31",
      basis: "manual",
      evidence: "primeira",
    });
    expect(firstError).toBeNull();

    const { error: overlappingError } = await admin.from("union_representation").insert({
      tenant_id: tenant.id,
      establishment_id: establishmentId,
      status: "reconhecida",
      valid_from: "2022-01-01", // sobrepõe dez/2022 da primeira
      valid_until: null,
      basis: "manual",
      evidence: "segunda, sobreposta",
    });
    expect(overlappingError).not.toBeNull();
    expect(overlappingError?.code).toBe("23P01"); // exclusion_violation
  });

  it("resolve corretamente a representação certa para cada data ao longo de três períodos", async () => {
    const otherEstablishment = await createEstablishment(tenant.id);

    const periods = [
      { valid_from: "2016-01-01", valid_until: "2018-12-31", evidence: "período 1" },
      { valid_from: "2019-01-01", valid_until: "2023-12-31", evidence: "período 2" },
      { valid_from: "2024-01-01", valid_until: null, evidence: "período 3" },
    ];
    for (const period of periods) {
      const { error } = await admin.from("union_representation").insert({
        tenant_id: tenant.id,
        establishment_id: otherEstablishment,
        status: "reconhecida",
        basis: "manual",
        ...period,
      });
      if (error) throw error;
    }

    const at2017 = await resolveRepresentation(admin, tenant.id, otherEstablishment, "2017-06-01");
    expect(at2017.representation?.evidence).toBe("período 1");

    const at2021 = await resolveRepresentation(admin, tenant.id, otherEstablishment, "2021-06-01");
    expect(at2021.representation?.evidence).toBe("período 2");

    const at2025 = await resolveRepresentation(admin, tenant.id, otherEstablishment, "2025-06-01");
    expect(at2025.representation?.evidence).toBe("período 3");
  });

  it("consulta em data anterior a qualquer vigência retorna vazio, não erro", async () => {
    const otherEstablishment = await createEstablishment(tenant.id);
    const { error } = await admin.from("union_representation").insert({
      tenant_id: tenant.id,
      establishment_id: otherEstablishment,
      status: "reconhecida",
      valid_from: "2024-01-01",
      valid_until: null,
      basis: "manual",
      evidence: "único período",
    });
    if (error) throw error;

    const result = await resolveRepresentation(admin, tenant.id, otherEstablishment, "2010-01-01");
    expect(result.status).toBe("sem_representacao");
    expect(result.representation).toBeNull();
    expect(result.conflicts).toEqual([]);
  });

  async function createEstablishment(tenantId: string) {
    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenantId, cnpj: unique("00"), legal_name: "Empresa Temporal Auxiliar" })
      .select()
      .single();
    if (companyError) throw companyError;

    const { data: establishment, error: establishmentError } = await admin
      .from("establishment")
      .insert({ tenant_id: tenantId, company_id: company.id, cnpj: unique("00"), kind: "matriz" })
      .select()
      .single();
    if (establishmentError) throw establishmentError;
    return establishment.id as string;
  }
});
