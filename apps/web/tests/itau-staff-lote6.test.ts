import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  generateNossoNumero,
  getPaymentGateway,
  isItauBolePaid,
  ItauBolecodePaymentGateway,
  parseItauWebhook,
} from "@syntex/payments";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";
import {
  createChargePaymentIntent,
  processPaymentWebhook,
} from "@/lib/domain/payment-intent";
import {
  acceptStaffInvite,
  createDepartment,
  createStaffInvite,
  hashInviteToken,
} from "@/lib/domain/staff-invite";

describe("Itaú — utilitários e adaptador (sem bridge)", () => {
  it("generateNossoNumero é determinístico e tem 8 dígitos", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(generateNossoNumero(id)).toBe(generateNossoNumero(id));
    expect(generateNossoNumero(id)).toMatch(/^\d{8}$/);
  });

  it("isItauBolePaid detecta liquidação sem falso positivo cego", () => {
    expect(isItauBolePaid({ situacao: "LIQUIDADO" })).toBe(true);
    expect(isItauBolePaid({ situacao: "EM ABERTO" })).toBe(false);
    expect(
      isItauBolePaid({
        boletos: [{ numeroNossoNumero: "12345678", tipoLiquidacao: "06" }],
      }),
    ).toBe(true);
  });

  it("getPaymentGateway liga itau_bolecode sem secrets (mock)", () => {
    const gw = getPaymentGateway("itau_bolecode");
    expect(gw).toBeInstanceOf(ItauBolecodePaymentGateway);
  });

  it("mock cria PIX com nosso_numero", async () => {
    const gw = new ItauBolecodePaymentGateway({ realEnabled: false });
    const intent = await gw.createIntent({
      tenantId: "t",
      chargeId: "11111111-1111-1111-1111-111111111111",
      amount: 50,
      dueDate: "2026-09-20",
      billingType: "pix",
      customer: { name: "ACME", cnpj: "12345678000199" },
    });
    expect(intent.provider).toBe("itau_bolecode");
    expect(intent.nossoNumero).toHaveLength(8);
    expect(intent.pixCopyPaste).toContain("MOCK:ITAU");
  });

  it("parseItauWebhook PIX e boleto", () => {
    const pix = parseItauWebhook({
      pix: [{ txid: "txid-abc", valor: "10.00" }],
    });
    expect(pix.status).toBe("paid");
    expect(pix.providerChargeId).toBe("txid-abc");

    const boleto = parseItauWebhook({
      boletos: [{ numeroNossoNumero: "12345678", tipoLiquidacao: "LIQUIDADO" }],
    });
    expect(boleto.status).toBe("paid");
    expect(boleto.nossoNumero).toBe("12345678");
  });
});

describe("Itaú intent + webhook (integração)", () => {
  let tenant: { id: string };
  let companyId: string;
  let ruleId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("itau");
    await admin
      .from("tenant")
      .update({ default_charge_provider: "itau_bolecode" })
      .eq("id", tenant.id);

    const { data: company, error } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Itaú" })
      .select()
      .single();
    if (error) throw error;
    companyId = company.id;

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
    const { data: agreement } = await admin
      .from("collective_agreement")
      .insert({
        tenant_id: tenant.id,
        kind: "cct",
        mediador_number: "MR-ITAU",
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        base_date: "2026-01-01",
        economic_category_id: economic!.id,
        professional_category_id: professional!.id,
      })
      .select()
      .single();
    const { data: rule } = await admin
      .from("contribution_rule")
      .insert({
        tenant_id: tenant.id,
        collective_agreement_id: agreement!.id,
        type: "assistencial",
        valid_from: "2026-01-01",
        calculation_base: "empresa",
        value_type: "valor_fixo",
        value: 40,
      })
      .select()
      .single();
    ruleId = rule!.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("cria intent mock e liquidação via webhook por nosso_numero", async () => {
    const { charge } = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-08",
    });

    const { intent, charge: withIntent } = await createChargePaymentIntent(admin, {
      tenantId: tenant.id,
      chargeId: charge.id,
      billingType: "boleto",
    });

    expect(withIntent.provider).toBe("itau_bolecode");
    expect(withIntent.nosso_numero).toBe(intent.nossoNumero);

    const event = parseItauWebhook({
      event_id: `itau-test-${charge.id}`,
      nosso_numero: intent.nossoNumero,
      provider_charge_id: intent.providerChargeId,
      status: "paid",
      billing_type: "boleto",
    });

    const first = await processPaymentWebhook(admin, {
      tenantId: tenant.id,
      event: {
        provider: event.provider,
        externalEventId: event.externalEventId,
        providerChargeId: event.providerChargeId,
        status: event.status,
        billingType: event.billingType,
        raw: event.raw,
      },
      matchKeys: event.matchKeys,
    });
    expect(first.duplicate).toBe(false);
    expect(first.chargeId).toBe(charge.id);

    const { data: refreshed } = await admin.from("charge").select("status").eq("id", charge.id).single();
    expect(refreshed?.status).toBe("pago");
  });
});

describe("department + staff_invite", () => {
  let tenant: { id: string };
  let inviterId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("staff");
    const email = `${unique("inv")}@example.com`;
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (authError) throw authError;

    const { data: user, error } = await admin
      .from("app_user")
      .insert({
        tenant_id: tenant.id,
        auth_user_id: created.user.id,
        full_name: "Convidador",
        email,
      })
      .select()
      .single();
    if (error) throw error;
    inviterId = user.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("cria departamento e aceita convite com escopo department", async () => {
    const department = await createDepartment(admin, {
      tenantId: tenant.id,
      name: unique("Setor"),
    });

    const { invite, token } = await createStaffInvite(admin, {
      tenantId: tenant.id,
      email: `${unique("staff")}@example.com`,
      roleName: "atendimento",
      scope: "department",
      departmentId: department.id,
      invitedBy: inviterId,
    });

    expect(invite.token_hash).toBe(hashInviteToken(token));
    expect(invite.department_id).toBe(department.id);

    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email: invite.email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (authError) throw authError;

    const accepted = await acceptStaffInvite(admin, {
      token,
      authUserId: created.user.id,
      fullName: "Novo Staff",
    });
    expect(accepted.invite.accepted_at).toBeTruthy();

    const { data: ur } = await admin
      .from("user_role")
      .select("scope, department_id")
      .eq("app_user_id", accepted.appUserId)
      .single();
    expect(ur?.scope).toBe("department");
    expect(ur?.department_id).toBe(department.id);
  });
});
