import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hasAnyGrant } from "@syntex/permissions";
import { admin, createTestTenant, createTestUser, deleteTestTenant, unique } from "./helpers";
import { createCompanyWithMaster } from "@/lib/domain/create-company-with-master";
import { claimRepresentation } from "@/lib/domain/claim-representation";
import { recognizeRepresentation } from "@/lib/domain/recognize-representation";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";
import { resolveCompanyDues } from "@/lib/domain/resolve-dues";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";

/**
 * C2 — smoke da cadeia mínima Core V1 (SYNTEX-VERSIONS §2.3 / runbook).
 *
 * Domínio + persistência (não Playwright): cadastro com município → claim →
 * recognize → CCT/regras → dues → charge com origem legível → grants negativos.
 */
function cnpjVariant(branch: number): string {
  const root = "11222333";
  const branchStr = String(branch).padStart(4, "0");
  const base = `${root}${branchStr}`;
  const digits = base.split("").map(Number);
  const d1 = cnpjDv(digits, 12);
  const d2 = cnpjDv([...digits, d1], 13);
  return `${base}${d1}${d2}`;
}

function cnpjDv(digits: number[], len: number): number {
  const weights =
    len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + digits[i]! * w, 0);
  const rem = sum % 11;
  return rem < 2 ? 0 : 11 - rem;
}

describe("C2 smoke — ciclo Core V1", () => {
  let tenant: { id: string };
  let municipalityId: string;
  let cnaeId: string;
  let registrationId: string;
  let ruleId: string;
  let mediador = "MR-CORE-V1-SMOKE";
  let diretoria: Awaited<ReturnType<typeof createTestUser>>;
  let inviter: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    tenant = await createTestTenant("core-v1-smoke");
    diretoria = await createTestUser(tenant.id, "diretoria", "tenant");
    inviter = await createTestUser(tenant.id, "admin", "tenant");

    const { data: mun } = await admin.from("municipality").select("id").limit(1).maybeSingle();
    if (!mun) throw new Error("municipality ausente — rode seed de referência global");
    municipalityId = mun.id;

    const { data: cnae } = await admin.from("cnae").select("id").limit(1).maybeSingle();
    if (!cnae) throw new Error("cnae ausente — rode seed de referência global");
    cnaeId = cnae.id;

    const { data: economic } = await admin
      .from("economic_category")
      .insert({ tenant_id: tenant.id, name: unique("EcoSmoke") })
      .select()
      .single();
    const { data: professional } = await admin
      .from("professional_category")
      .insert({ tenant_id: tenant.id, name: unique("ProSmoke") })
      .select()
      .single();

    const { data: registration, error: regError } = await admin
      .from("union_registration")
      .insert({
        tenant_id: tenant.id,
        registry_number: unique("REG-SMOKE"),
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
        mediador_number: mediador,
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
        value: 55,
      })
      .select()
      .single();
    if (ruleError) throw ruleError;
    ruleId = rule.id;
  });

  afterAll(async () => {
    if (tenant?.id) await deleteTestTenant(tenant.id);
  });

  it("caminho feliz DoD: empresa/estab → claim → recognize → CCT → dues → charge+origem", async () => {
    const created = await createCompanyWithMaster(admin, {
      tenantId: tenant.id,
      invitedBy: inviter.appUserId,
      legalName: "Empresa Core V1 Smoke",
      cnpj: cnpjVariant(901),
      municipalityId,
      primaryCnaeId: cnaeId,
      accountResponsibleName: "Resp Smoke",
      accountResponsibleEmail: `${unique("smoke")}@example.com`,
    });

    expect(created.company.municipality_id).toBe(municipalityId);
    expect(created.establishment.municipality_id).toBe(municipalityId);
    expect(created.establishment.kind).toBe("matriz");

    const companyId = created.company.id;
    const establishmentId = created.establishment.id;
    const competence = "2026-03";
    const referenceDate = "2026-03-15";

    const beforeClaim = await resolveRepresentation(
      admin,
      tenant.id,
      establishmentId,
      referenceDate,
    );
    expect(beforeClaim.status).toBe("sem_representacao");
    expect(beforeClaim.agreement).toBeNull();

    const claim = await claimRepresentation(
      diretoria.client,
      { tenantId: tenant.id, appUserId: diretoria.appUserId },
      {
        establishmentId,
        unionRegistrationId: registrationId,
        validFrom: "2026-01-01",
        basis: "carta_sindical",
        evidence: "smoke core v1 — não deve ir ao snapshot",
      },
    );
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;

    const duesBefore = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId,
      competence,
    });
    expect(duesBefore).toEqual([]);

    const claimedResolve = await resolveRepresentation(
      admin,
      tenant.id,
      establishmentId,
      referenceDate,
    );
    expect(claimedResolve.status).toBe("reivindicada");
    expect(claimedResolve.agreement).toBeNull();
    expect(claimedResolve.contributionRules).toEqual([]);

    const recognized = await recognizeRepresentation(
      diretoria.client,
      { tenantId: tenant.id, appUserId: diretoria.appUserId },
      { representationId: claim.representation.id },
    );
    expect(recognized.ok).toBe(true);
    if (!recognized.ok) return;
    expect(recognized.representation.status).toBe("reconhecida");

    const resolved = await resolveRepresentation(
      admin,
      tenant.id,
      establishmentId,
      referenceDate,
    );
    expect(resolved.status).toBe("reconhecida");
    expect(resolved.agreement?.mediador_number).toBe(mediador);
    expect(resolved.contributionRules.some((r) => r.id === ruleId)).toBe(true);

    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId,
      competence,
    });
    expect(dues.length).toBeGreaterThanOrEqual(1);
    const due = dues.find((d) => d.contributionRuleId === ruleId);
    expect(due).toBeTruthy();
    expect(due!.representationStatus).toBe("reconhecida");
    expect(due!.establishmentId).toBe(establishmentId);
    expect(due!.amount).toBe(55);

    const generated = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence,
    });
    expect(generated.created).toBe(true);
    expect(Number(generated.charge.amount)).toBe(55);

    const snapshot = generated.obligation.rule_snapshot as {
      origin?: {
        establishment_id: string;
        representation_id: string | null;
        representation_status: string;
      } | null;
      agreement?: { mediador_number: string | null } | null;
      rule: { type: string };
      competence?: string;
    };

    expect(snapshot.origin?.establishment_id).toBe(establishmentId);
    expect(snapshot.origin?.representation_id).toBe(recognized.representation.id);
    expect(snapshot.origin?.representation_status).toBe("reconhecida");
    expect(snapshot.agreement?.mediador_number).toBe(mediador);
    expect(snapshot.rule.type).toBe("mensalidade");
    expect(JSON.stringify(snapshot)).not.toMatch(/evidence/i);
  });

  it("DoD step 6 — grants: atendimento/financeiro sem writes críticos de representação", () => {
    expect(hasAnyGrant([{ role: "atendimento", scope: "tenant" }], "representation.write")).toBe(
      false,
    );
    expect(hasAnyGrant([{ role: "atendimento", scope: "tenant" }], "representation.decide")).toBe(
      false,
    );
    expect(hasAnyGrant([{ role: "atendimento", scope: "tenant" }], "finance.write")).toBe(false);
    expect(hasAnyGrant([{ role: "atendimento", scope: "tenant" }], "company.write")).toBe(false);

    expect(hasAnyGrant([{ role: "financeiro", scope: "tenant" }], "representation.read")).toBe(
      false,
    );
    expect(hasAnyGrant([{ role: "financeiro", scope: "tenant" }], "representation.decide")).toBe(
      false,
    );
    expect(hasAnyGrant([{ role: "financeiro", scope: "tenant" }], "finance.write")).toBe(true);

    expect(hasAnyGrant([{ role: "diretoria", scope: "tenant" }], "representation.decide")).toBe(
      true,
    );
  });

  it("âncoras UI do ciclo (origem + resolver) permanecem no produto", () => {
    const origin = readFileSync(
      join(process.cwd(), "features/charges/charge-obligation-origin.tsx"),
      "utf8",
    );
    expect(origin).toContain("Por que esta cobrança existe");
    expect(origin).toContain("Representação na origem");

    const duesForm = readFileSync(
      join(process.cwd(), "features/charges/resolve-dues-form.tsx"),
      "utf8",
    );
    expect(duesForm).toContain("/api/dues");

    const applicability = readFileSync(
      join(process.cwd(), "features/agreements/resolve-agreement-applicability-form.tsx"),
      "utf8",
    );
    expect(applicability).toContain("Resolver aplicabilidade");
  });
});
