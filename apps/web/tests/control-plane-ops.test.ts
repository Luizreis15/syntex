import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";
import { cancelCharge, createPlatformNotification } from "@/lib/domain/platform-ops";
import { fetchPlatformMetrics } from "@/lib/domain/platform-metrics";

describe("Lote 12 — ops control plane", () => {
  let tenantId: string;
  let companyId: string;
  let ruleId: string;
  let platformAdminId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant("ops12");
    tenantId = tenant.id;
    await admin.from("tenant").update({ default_charge_provider: "stub" }).eq("id", tenantId);

    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenantId, cnpj: unique("00"), legal_name: "Co Ops" })
      .select()
      .single();
    if (companyError) throw companyError;
    companyId = company.id;

    const { data: economic, error: ecoError } = await admin
      .from("economic_category")
      .insert({ tenant_id: tenantId, name: unique("Eco") })
      .select()
      .single();
    if (ecoError) throw ecoError;

    const { data: professional, error: proError } = await admin
      .from("professional_category")
      .insert({ tenant_id: tenantId, name: unique("Pro") })
      .select()
      .single();
    if (proError) throw proError;

    const { data: agreement, error: agreementError } = await admin
      .from("collective_agreement")
      .insert({
        tenant_id: tenantId,
        kind: "cct",
        mediador_number: unique("MR"),
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        base_date: "2026-01-01",
        economic_category_id: economic.id,
        professional_category_id: professional.id,
      })
      .select()
      .single();
    if (agreementError) throw agreementError;

    const { data: rule, error: ruleError } = await admin
      .from("contribution_rule")
      .insert({
        tenant_id: tenantId,
        collective_agreement_id: agreement.id,
        type: "assistencial",
        valid_from: "2026-01-01",
        valid_until: null,
        calculation_base: "folha",
        value_type: "valor_fixo",
        value: 100,
      })
      .select()
      .single();
    if (ruleError) throw ruleError;
    ruleId = rule.id;

    const email = `${unique("pa")}@example.com`;
    const { data: auth, error: authError } = await admin.auth.admin.createUser({
      email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (authError) throw authError;
    const { data: pa, error: paError } = await admin
      .from("platform_admin")
      .insert({ auth_user_id: auth.user!.id, email, full_name: "PA Ops" })
      .select()
      .single();
    if (paError) throw paError;
    platformAdminId = pa.id;
  });

  afterAll(async () => {
    await admin.from("platform_admin").delete().eq("id", platformAdminId);
    await deleteTestTenant(tenantId);
  });

  it("cancelCharge marca cancelado, motivo e outbox; bloqueia re-cancel", async () => {
    const { charge } = await generateObligationWithCharge(admin, {
      tenantId,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-03",
      dueDate: "2026-03-20",
    });

    const cancelled = await cancelCharge(admin, {
      tenantId,
      chargeId: charge.id,
      reason: "duplicidade operacional",
      platformAdminId,
    });
    expect(cancelled.status).toBe("cancelado");
    expect(cancelled.cancel_reason).toBe("duplicidade operacional");
    expect(cancelled.cancelled_at).toBeTruthy();

    const { data: events } = await admin
      .from("outbox_event")
      .select("event_type")
      .eq("aggregate_id", charge.id)
      .eq("event_type", "charge.cancelled");
    expect(events?.length).toBeGreaterThanOrEqual(1);

    await expect(
      cancelCharge(admin, {
        tenantId,
        chargeId: charge.id,
        reason: "de novo",
        platformAdminId,
      }),
    ).rejects.toThrow();
  });

  it("platform_notification cria e métricas leem unread", async () => {
    await createPlatformNotification(admin, {
      title: "Alerta teste",
      body: "corpo",
      severity: "info",
      tenantId,
      createdByPlatformAdminId: platformAdminId,
    });
    const metrics = await fetchPlatformMetrics(admin);
    expect(metrics.unreadNotifications).toBeGreaterThanOrEqual(1);
    expect(metrics.monthly.length).toBe(6);
  });
});
