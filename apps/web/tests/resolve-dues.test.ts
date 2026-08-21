import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { resolveCompanyDues } from "@/lib/domain/resolve-dues";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";

describe("resolveCompanyDues — o que a empresa deve na competência", () => {
  let tenant: { id: string };
  let companyId: string;
  let ruleFixedId: string;
  let rulePercentId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("dues");

    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Dues" })
      .select()
      .single();
    if (companyError) throw companyError;
    companyId = company.id;

    const { data: establishment, error: estError } = await admin
      .from("establishment")
      .insert({
        tenant_id: tenant.id,
        company_id: companyId,
        cnpj: unique("00"),
        kind: "matriz",
      })
      .select()
      .single();
    if (estError) throw estError;

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

    const { error: repError } = await admin.from("union_representation").insert({
      tenant_id: tenant.id,
      establishment_id: establishment.id,
      union_registration_id: registration.id,
      status: "reconhecida",
      valid_from: "2020-01-01",
      valid_until: null,
      basis: "manual",
      evidence: "seed dues",
    });
    if (repError) throw repError;

    const { data: agreement, error: agreementError } = await admin
      .from("collective_agreement")
      .insert({
        tenant_id: tenant.id,
        kind: "cct",
        mediador_number: "MR-DUES",
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        base_date: "2026-01-01",
        economic_category_id: economic.id,
        professional_category_id: professional.id,
      })
      .select()
      .single();
    if (agreementError) throw agreementError;

    const { data: ruleFixed, error: fixedError } = await admin
      .from("contribution_rule")
      .insert({
        tenant_id: tenant.id,
        collective_agreement_id: agreement.id,
        type: "mensalidade",
        valid_from: "2026-01-01",
        calculation_base: "empresa",
        value_type: "valor_fixo",
        value: 120,
      })
      .select()
      .single();
    if (fixedError) throw fixedError;
    ruleFixedId = ruleFixed.id;

    const { data: rulePercent, error: percentError } = await admin
      .from("contribution_rule")
      .insert({
        tenant_id: tenant.id,
        collective_agreement_id: agreement.id,
        type: "assistencial",
        valid_from: "2026-01-01",
        calculation_base: "folha",
        value_type: "percentual",
        value: 2,
      })
      .select()
      .single();
    if (percentError) throw percentError;
    rulePercentId = rulePercent.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("lista débitos das regras da CCT via representação", async () => {
    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId,
      competence: "2026-08",
      calculationBaseAmount: 5_000,
    });

    expect(dues).toHaveLength(2);
    const fixed = dues.find((d) => d.contributionRuleId === ruleFixedId);
    const percent = dues.find((d) => d.contributionRuleId === rulePercentId);
    expect(fixed?.amount).toBe(120);
    expect(fixed?.needsCalculationBase).toBe(false);
    expect(percent?.amount).toBe(100);
    expect(percent?.needsCalculationBase).toBe(false);
    expect(fixed?.existingChargeId).toBeNull();
  });

  it("percentual sem base marca needsCalculationBase", async () => {
    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId,
      competence: "2026-08",
    });
    const percent = dues.find((d) => d.contributionRuleId === rulePercentId);
    expect(percent?.needsCalculationBase).toBe(true);
    expect(percent?.amount).toBeNull();
  });

  it("marca cobrança já existente após gerar", async () => {
    await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleFixedId,
      competence: "2026-09",
    });

    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId,
      competence: "2026-09",
      calculationBaseAmount: 1_000,
    });
    const fixed = dues.find((d) => d.contributionRuleId === ruleFixedId);
    expect(fixed?.existingObligationId).toBeTruthy();
    expect(fixed?.existingChargeId).toBeTruthy();
  });

  it("empresa sem estabelecimento retorna vazio", async () => {
    const { data: lonely } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Sem Estab" })
      .select()
      .single();

    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId: lonely!.id,
      competence: "2026-08",
    });
    expect(dues).toEqual([]);
  });
});
