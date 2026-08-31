import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  AsaasPaymentGateway,
  ItauBolecodePaymentGateway,
  StubPaymentGateway,
  getPaymentGateway,
  mapAsaasEventToStatus,
  mapAsaasPaymentStatus,
  parseAsaasWebhook,
  parseStubWebhook,
} from "@syntex/payments";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";
import {
  createChargePaymentIntent,
  processPaymentWebhook,
  syncChargePaymentStatus,
} from "@/lib/domain/payment-intent";

describe("porta de pagamento (stub + asaas, sem rede)", () => {
  it("StubPaymentGateway gera PIX e boleto determinísticos", async () => {
    const gateway = new StubPaymentGateway();
    const pix = await gateway.createIntent({
      tenantId: "t",
      chargeId: "c1",
      amount: 100,
      dueDate: "2026-09-10",
      billingType: "pix",
      customer: { name: "ACME" },
    });
    expect(pix.provider).toBe("stub");
    expect(pix.providerChargeId).toBe("stub_c1");
    expect(pix.pixCopyPaste).toContain("STUBPIX");

    const boleto = await gateway.createIntent({
      tenantId: "t",
      chargeId: "c2",
      amount: 50,
      dueDate: "2026-09-10",
      billingType: "boleto",
      customer: { name: "ACME" },
    });
    expect(boleto.boletoUrl).toContain("stub.local/boleto/c2");
    expect(boleto.barcode).toBeTruthy();
  });

  it("getPaymentGateway exige ASAAS_API_KEY e liga Itaú (mock)", () => {
    expect(() => getPaymentGateway("asaas")).toThrow(/ASAAS_API_KEY/);
    expect(getPaymentGateway("asaas", { asaas: { apiKey: "x" } })).toBeInstanceOf(
      AsaasPaymentGateway,
    );
    expect(getPaymentGateway("itau_bolecode")).toBeInstanceOf(ItauBolecodePaymentGateway);
  });

  it("mapeia eventos e status Asaas (puro)", () => {
    expect(mapAsaasEventToStatus("PAYMENT_CONFIRMED")).toBe("paid");
    expect(mapAsaasEventToStatus("PAYMENT_CREATED")).toBeNull();
    expect(mapAsaasPaymentStatus("RECEIVED")).toBe("paid");
    expect(mapAsaasPaymentStatus("OVERDUE")).toBe("overdue");

    const event = parseAsaasWebhook({
      event: "PAYMENT_RECEIVED",
      payment: { id: "pay_1", billingType: "PIX" },
    });
    expect(event.provider).toBe("asaas");
    expect(event.externalEventId).toBe("pay_1:PAYMENT_RECEIVED");
    expect(event.status).toBe("paid");
    expect(event.billingType).toBe("pix");
  });

  it("AsaasPaymentGateway cria customer + payment com fetch mockado", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/customers") && init?.method === "POST") {
        return new Response(JSON.stringify({ id: "cus_abc" }), { status: 200 });
      }
      if (path.endsWith("/payments") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            id: "pay_xyz",
            status: "PENDING",
            invoiceUrl: "https://asaas.test/i/xyz",
          }),
          { status: 200 },
        );
      }
      if (path.includes("/pixQrCode")) {
        return new Response(JSON.stringify({ payload: "00020126PIX" }), { status: 200 });
      }
      return new Response(JSON.stringify({ errors: [{ description: "unexpected" }] }), {
        status: 500,
      });
    }) as unknown as typeof fetch;

    const gateway = new AsaasPaymentGateway({
      apiKey: "test-key",
      sandbox: true,
      fetchImpl,
    });

    const intent = await gateway.createIntent({
      tenantId: "t",
      chargeId: "charge-1",
      amount: 80,
      dueDate: "2026-09-15",
      billingType: "pix",
      customer: { name: "ACME Ltda", cnpj: "12.345.678/0001-90" },
    });

    expect(intent.provider).toBe("asaas");
    expect(intent.providerChargeId).toBe("pay_xyz");
    expect(intent.customerExternalId).toBe("cus_abc");
    expect(intent.pixCopyPaste).toBe("00020126PIX");
    expect(intent.paymentLink).toBe("https://asaas.test/i/xyz");
    expect(fetchImpl).toHaveBeenCalled();
  });

  it("parseStubWebhook exige event_id e provider_charge_id", () => {
    expect(() => parseStubWebhook({})).toThrow(/obrigatórios/);
    const event = parseStubWebhook({
      event_id: "evt-1",
      provider_charge_id: "stub_x",
      status: "paid",
      billing_type: "pix",
    });
    expect(event.status).toBe("paid");
    expect(event.provider).toBe("stub");
  });
});

describe("intent + webhook idempotente (integração)", () => {
  let tenant: { id: string };
  let companyId: string;
  let ruleId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("pay");

    await admin.from("tenant").update({ default_charge_provider: "stub" }).eq("id", tenant.id);

    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Gateway" })
      .select()
      .single();
    if (companyError) throw companyError;
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
        mediador_number: "MR-PAY",
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
        calculation_base: "folha",
        value_type: "valor_fixo",
        value: 75,
      })
      .select()
      .single();
    ruleId = rule!.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("cria intent stub, sincroniza pago e grava outbox intent_created", async () => {
    const { charge } = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-07",
    });

    const { intent, charge: withIntent } = await createChargePaymentIntent(admin, {
      tenantId: tenant.id,
      chargeId: charge.id,
      billingType: "pix",
    });
    expect(withIntent.provider).toBe("stub");
    expect(withIntent.provider_charge_id).toBe(intent.providerChargeId);
    expect(withIntent.pix_copy_paste).toBeTruthy();

    const { data: events } = await admin
      .from("outbox_event")
      .select("event_type")
      .eq("aggregate_id", charge.id)
      .eq("event_type", "charge.intent_created");
    expect(events?.length).toBeGreaterThanOrEqual(1);

    const synced = await syncChargePaymentStatus(admin, {
      tenantId: tenant.id,
      chargeId: charge.id,
      forceStatus: "paid",
    });
    expect(synced.gatewayStatus).toBe("paid");
    expect(synced.charge.status).toBe("pago");
    expect(synced.charge.payment_method).toBe("pix");
  });

  it("webhook stub é idempotente no external_event_id", async () => {
    const { charge } = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-06",
    });
    await createChargePaymentIntent(admin, {
      tenantId: tenant.id,
      chargeId: charge.id,
      billingType: "boleto",
    });

    const event = parseStubWebhook({
      event_id: `evt-${charge.id}`,
      provider_charge_id: `stub_${charge.id}`,
      status: "paid",
      billing_type: "boleto",
      tenant_id: tenant.id,
    });

    const first = await processPaymentWebhook(admin, { tenantId: tenant.id, event });
    expect(first.duplicate).toBe(false);
    expect(first.chargeId).toBe(charge.id);

    const second = await processPaymentWebhook(admin, { tenantId: tenant.id, event });
    expect(second.duplicate).toBe(true);

    const { data: refreshed } = await admin
      .from("charge")
      .select("status, payment_method")
      .eq("id", charge.id)
      .single();
    expect(refreshed?.status).toBe("pago");
    expect(refreshed?.payment_method).toBe("boleto");
  });

  it("webhook asaas liquidado é idempotente", async () => {
    const { charge } = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-05",
    });

    await admin
      .from("charge")
      .update({
        provider: "asaas",
        provider_charge_id: `pay_${charge.id}`,
        billing_type: "pix",
      })
      .eq("id", charge.id)
      .eq("tenant_id", tenant.id);

    const event = parseAsaasWebhook({
      event: "PAYMENT_CONFIRMED",
      payment: { id: `pay_${charge.id}`, billingType: "PIX" },
    });

    const first = await processPaymentWebhook(admin, { tenantId: tenant.id, event });
    expect(first.duplicate).toBe(false);
    expect(first.chargeId).toBe(charge.id);

    const second = await processPaymentWebhook(admin, { tenantId: tenant.id, event });
    expect(second.duplicate).toBe(true);

    const { data: refreshed } = await admin.from("charge").select("status").eq("id", charge.id).single();
    expect(refreshed?.status).toBe("pago");
  });
});
