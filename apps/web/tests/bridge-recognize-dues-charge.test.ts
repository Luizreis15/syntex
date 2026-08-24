import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, createTestUser, deleteTestTenant, unique } from "./helpers";
import { claimRepresentation } from "@/lib/domain/claim-representation";
import { recognizeRepresentation } from "@/lib/domain/recognize-representation";
import { resolveCompanyDues } from "@/lib/domain/resolve-dues";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";

/**
 * A2 — ponte financeira mínima:
 * claim → reconhecer → dues → obrigação+charge com origin no snapshot.
 */
describe("bridge A2 — recognize → dues → charge", () => {
  let tenant: { id: string };
  let companyId: string;
  let establishmentId: string;
  let registrationId: string;
  let ruleId: string;
  let actor: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    tenant = await createTestTenant("bridge-a2");
    actor = await createTestUser(tenant.id, "diretoria", "tenant");

    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Bridge A2" })
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
    establishmentId = establishment.id;

    const { data: economic } = await admin
      .from("economic_category")
      .insert({ tenant_id: tenant.id, name: unique("Eco") })
      .select()
      .single();
    const { data: professional } = await admin
      .from("professional_category")
      .insert({ tenant_id: tenant.id, name: unique("Pro") })
      .select()
      .single();

    const { data: registration, error: regError } = await admin
      .from("union_registration")
      .insert({
        tenant_id: tenant.id,
        registry_number: unique("REG"),
        registered_at: "2020-01-01",
        economic_category_id: economic!.id,
        professional_category_id: professional!.id,
      })
      .select()
      .single();
    if (regError) throw regError;
    registrationId = registration.id;

    const { data: agreement, error: agrError } = await admin
      .from("collective_agreement")
      .insert({
        tenant_id: tenant.id,
        kind: "cct",
        mediador_number: "MR-BRIDGE-A2",
        valid_from: "2024-01-01",
        valid_until: "2027-12-31",
        base_date: "2024-01-01",
        economic_category_id: economic!.id,
        professional_category_id: professional!.id,
      })
      .select()
      .single();
    if (agrError) throw agrError;

    const { data: rule, error: ruleError } = await admin
      .from("contribution_rule")
      .insert({
        tenant_id: tenant.id,
        collective_agreement_id: agreement.id,
        type: "mensalidade",
        valid_from: "2024-01-01",
        valid_until: null,
        calculation_base: "folha",
        value_type: "valor_fixo",
        value: 42,
      })
      .select()
      .single();
    if (ruleError) throw ruleError;
    ruleId = rule.id;
  });

  afterAll(async () => {
    if (tenant?.id) await deleteTestTenant(tenant.id);
  });

  it("antes de reconhecer: dues vazios", async () => {
    const claim = await claimRepresentation(
      actor.client,
      { tenantId: tenant.id, appUserId: actor.appUserId },
      {
        establishmentId,
        unionRegistrationId: registrationId,
        validFrom: "2026-01-01",
        basis: "carta_sindical",
        evidence: "bridge a2",
      },
    );
    expect(claim.ok).toBe(true);

    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId,
      competence: "2026-06",
    });
    expect(dues).toEqual([]);
  });

  it("após reconhecer: dues → charge com origin sindical no snapshot", async () => {
    const { data: claimRow } = await admin
      .from("union_representation")
      .select("id, status")
      .eq("establishment_id", establishmentId)
      .eq("status", "reivindicada")
      .maybeSingle();

    expect(claimRow).toBeTruthy();

    const recognized = await recognizeRepresentation(
      actor.client,
      { tenantId: tenant.id, appUserId: actor.appUserId },
      { representationId: claimRow!.id },
    );
    expect(recognized.ok).toBe(true);
    if (!recognized.ok) return;

    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId,
      competence: "2026-06",
    });
    expect(dues.length).toBeGreaterThanOrEqual(1);
    const due = dues.find((d) => d.contributionRuleId === ruleId);
    expect(due).toBeTruthy();
    expect(due!.representationStatus).toBe("reconhecida");
    expect(due!.establishmentId).toBe(establishmentId);
    expect(due!.representationId).toBe(recognized.representation.id);
    expect(due!.amount).toBe(42);

    const generated = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-06",
    });
    expect(generated.created).toBe(true);
    expect(Number(generated.charge.amount)).toBe(42);

    const snapshot = generated.obligation.rule_snapshot as {
      origin?: {
        establishment_id: string;
        representation_id: string | null;
        representation_status: string;
      } | null;
      agreement?: { mediador_number: string | null } | null;
      rule: { type: string };
    };

    expect(snapshot.origin?.establishment_id).toBe(establishmentId);
    expect(snapshot.origin?.representation_id).toBe(recognized.representation.id);
    expect(snapshot.origin?.representation_status).toBe("reconhecida");
    expect(snapshot.agreement?.mediador_number).toBe("MR-BRIDGE-A2");
    expect(snapshot.rule.type).toBe("mensalidade");
    expect(JSON.stringify(snapshot)).not.toMatch(/evidence/i);
  });
});
