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


describe("semântica operacional — CCT só com reconhecida (Slice 1.3A)", () => {
  let tenant: { id: string };
  let establishmentId: string;
  let registrationId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("rep-sem");

    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Semântica" })
      .select()
      .single();
    if (companyError) throw companyError;

    const { data: establishment, error: estError } = await admin
      .from("establishment")
      .insert({
        tenant_id: tenant.id,
        company_id: company.id,
        cnpj: unique("00"),
        kind: "matriz",
      })
      .select()
      .single();
    if (estError) throw estError;
    establishmentId = establishment.id;

    const { data: economic, error: ecoError } = await admin
      .from("economic_category")
      .insert({ tenant_id: tenant.id, name: unique("Eco") })
      .select()
      .single();
    if (ecoError) throw ecoError;

    const { data: professional, error: proError } = await admin
      .from("professional_category")
      .insert({ tenant_id: tenant.id, name: unique("Pro") })
      .select()
      .single();
    if (proError) throw proError;

    const { data: registration, error: regError } = await admin
      .from("union_registration")
      .insert({
        tenant_id: tenant.id,
        registry_number: unique("REG"),
        registered_at: "2020-01-01",
        economic_category_id: economic.id,
        professional_category_id: professional.id,
      })
      .select()
      .single();
    if (regError) throw regError;
    registrationId = registration.id;

    const { data: agreement, error: agreementError } = await admin
      .from("collective_agreement")
      .insert({
        tenant_id: tenant.id,
        kind: "cct",
        mediador_number: "MR-SEM",
        valid_from: "2024-01-01",
        valid_until: "2027-12-31",
        base_date: "2024-01-01",
        economic_category_id: economic.id,
        professional_category_id: professional.id,
      })
      .select()
      .single();
    if (agreementError) throw agreementError;

    const { error: ruleError } = await admin.from("contribution_rule").insert({
      tenant_id: tenant.id,
      collective_agreement_id: agreement.id,
      type: "assistencial",
      valid_from: "2024-01-01",
      calculation_base: "empresa",
      value_type: "valor_fixo",
      value: 50,
    });
    if (ruleError) throw ruleError;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  async function setRepresentation(
    status: "reivindicada" | "reconhecida" | "disputada" | "perdida" | null,
  ) {
    await admin.from("union_representation").delete().eq("establishment_id", establishmentId);
    if (!status) return;
    const { error } = await admin.from("union_representation").insert({
      tenant_id: tenant.id,
      establishment_id: establishmentId,
      union_registration_id: registrationId,
      status,
      valid_from: "2024-01-01",
      valid_until: null,
      basis: "manual",
      evidence: `row ${status}`,
    });
    if (error) throw error;
  }

  it("0 vigentes → sem_representacao sem agreement", async () => {
    await setRepresentation(null);
    const result = await resolveRepresentation(admin, tenant.id, establishmentId, "2026-06-01");
    expect(result.status).toBe("sem_representacao");
    expect(result.agreement).toBeNull();
    expect(result.contributionRules).toEqual([]);
  });

  it("1 reivindicada → status/row/evidence legíveis; SEM agreement/rules", async () => {
    await setRepresentation("reivindicada");
    const result = await resolveRepresentation(admin, tenant.id, establishmentId, "2026-06-01");
    expect(result.status).toBe("reivindicada");
    expect(result.representation?.evidence).toBe("row reivindicada");
    expect(result.basis).toBe("manual");
    expect(result.agreement).toBeNull();
    expect(result.contributionRules).toEqual([]);
  });

  it("1 reconhecida → agreement + contributionRules", async () => {
    await setRepresentation("reconhecida");
    const result = await resolveRepresentation(admin, tenant.id, establishmentId, "2026-06-01");
    expect(result.status).toBe("reconhecida");
    expect(result.agreement).not.toBeNull();
    expect(result.contributionRules.length).toBeGreaterThan(0);
  });

  it("1 perdida → SEM agreement/rules (row ainda legível)", async () => {
    await setRepresentation("perdida");
    const result = await resolveRepresentation(admin, tenant.id, establishmentId, "2026-06-01");
    expect(result.status).toBe("perdida");
    expect(result.representation?.evidence).toBe("row perdida");
    expect(result.agreement).toBeNull();
    expect(result.contributionRules).toEqual([]);
  });

  it("1 disputada (row) → SEM agreement/rules", async () => {
    await setRepresentation("disputada");
    const result = await resolveRepresentation(admin, tenant.id, establishmentId, "2026-06-01");
    expect(result.status).toBe("disputada");
    expect(result.representation).not.toBeNull();
    expect(result.agreement).toBeNull();
    expect(result.contributionRules).toEqual([]);
  });

  it("2+ reivindicadas → disputada agregada sem agreement", async () => {
    await admin.from("union_representation").delete().eq("establishment_id", establishmentId);
    for (const evidence of ["A", "B"]) {
      const { error } = await admin.from("union_representation").insert({
        tenant_id: tenant.id,
        establishment_id: establishmentId,
        union_registration_id: registrationId,
        status: "reivindicada",
        valid_from: "2024-01-01",
        valid_until: null,
        basis: "cnae",
        evidence,
      });
      if (error) throw error;
    }
    const result = await resolveRepresentation(admin, tenant.id, establishmentId, "2026-06-01");
    expect(result.status).toBe("disputada");
    expect(result.representation).toBeNull();
    expect(result.conflicts).toHaveLength(2);
    expect(result.agreement).toBeNull();
    expect(result.contributionRules).toEqual([]);
  });
});
