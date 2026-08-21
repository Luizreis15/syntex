import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@syntex/database";
import {
  billingTypeToPaymentMethod,
  getPaymentGateway,
  mapGatewayStatusToChargeStatus,
  type BillingType,
  type ChargeProvider,
  type NormalizedWebhookEvent,
  type PaymentGatewayDeps,
  type PaymentIntentResult,
} from "@syntex/payments";

type Client = SupabaseClient<Database>;

export function paymentGatewayDepsFromEnv(): PaymentGatewayDeps {
  const asaasKey = process.env.ASAAS_API_KEY;
  const deps: PaymentGatewayDeps = {};
  if (asaasKey) {
    deps.asaas = {
      apiKey: asaasKey,
      sandbox: process.env.ASAAS_SANDBOX === "true",
    };
  }
  deps.itau = {
    realEnabled: process.env.ITAU_REAL_CHARGE_ENABLED === "true",
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeToken: process.env.BRIDGE_ACCESS_TOKEN,
  };
  return deps;
}

export async function resolveTenantProvider(
  supabase: Client,
  tenantId: string,
): Promise<ChargeProvider> {
  const { data, error } = await supabase
    .from("tenant")
    .select("default_charge_provider")
    .eq("id", tenantId)
    .single();
  if (error) throw error;
  return (data.default_charge_provider as ChargeProvider) ?? "stub";
}

/**
 * Emite intent no gateway do tenant e persiste na charge + outbox.
 */
export async function createChargePaymentIntent(
  supabase: Client,
  input: {
    tenantId: string;
    chargeId: string;
    billingType: BillingType;
  },
): Promise<{ charge: Database["public"]["Tables"]["charge"]["Row"]; intent: PaymentIntentResult }> {
  const { data: charge, error: chargeError } = await supabase
    .from("charge")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.chargeId)
    .single();
  if (chargeError || !charge) throw chargeError ?? new Error("cobrança não encontrada");

  if (charge.status !== "pendente" && charge.status !== "vencido") {
    throw new Error(`cobrança no status ${charge.status} não recebe intent`);
  }

  const { data: obligation, error: obligationError } = await supabase
    .from("obligation")
    .select("company_id")
    .eq("tenant_id", input.tenantId)
    .eq("id", charge.obligation_id)
    .single();
  if (obligationError || !obligation) throw obligationError ?? new Error("obrigação não encontrada");

  const { data: company } = await supabase
    .from("company")
    .select(
      "id, legal_name, trade_name, cnpj, asaas_customer_id, address_street, address_neighborhood, address_city, address_state, address_zip",
    )
    .eq("tenant_id", input.tenantId)
    .eq("id", obligation.company_id)
    .maybeSingle();

  const { data: tenantRow } = await supabase
    .from("tenant")
    .select("itau_beneficiario_id, itau_pix_key, itau_carteira_code")
    .eq("id", input.tenantId)
    .maybeSingle();

  const provider = await resolveTenantProvider(supabase, input.tenantId);
  const gateway = getPaymentGateway(provider, paymentGatewayDepsFromEnv());

  const hasAddress =
    company?.address_street &&
    company.address_neighborhood &&
    company.address_city &&
    company.address_state &&
    company.address_zip;

  const intent = await gateway.createIntent({
    tenantId: input.tenantId,
    chargeId: charge.id,
    amount: Number(charge.amount),
    dueDate: charge.due_date,
    billingType: input.billingType,
    customer: {
      name: company?.trade_name ?? company?.legal_name ?? "Empresa",
      cnpj: company?.cnpj,
      asaasCustomerId: company?.asaas_customer_id,
      address: hasAddress
        ? {
            street: company!.address_street!,
            neighborhood: company!.address_neighborhood!,
            city: company!.address_city!,
            state: company!.address_state!,
            zip: company!.address_zip!,
          }
        : null,
    },
    itau:
      tenantRow?.itau_beneficiario_id && tenantRow.itau_pix_key && tenantRow.itau_carteira_code
        ? {
            beneficiarioId: tenantRow.itau_beneficiario_id,
            pixKey: tenantRow.itau_pix_key,
            carteiraCode: tenantRow.itau_carteira_code,
          }
        : undefined,
  });

  if (intent.customerExternalId && company && !company.asaas_customer_id) {
    await supabase
      .from("company")
      .update({ asaas_customer_id: intent.customerExternalId })
      .eq("tenant_id", input.tenantId)
      .eq("id", company.id);
  }

  const { data: updated, error: updateError } = await supabase
    .from("charge")
    .update({
      provider: intent.provider,
      provider_charge_id: intent.providerChargeId,
      billing_type: input.billingType,
      pix_copy_paste: intent.pixCopyPaste ?? null,
      boleto_url: intent.boletoUrl ?? null,
      barcode: intent.barcode ?? null,
      payment_link: intent.paymentLink ?? null,
      nosso_numero: intent.nossoNumero ?? null,
      provider_payload: (intent.raw ?? {}) as Json,
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", charge.id)
    .select()
    .single();
  if (updateError) throw updateError;

  await supabase.from("outbox_event").insert({
    tenant_id: input.tenantId,
    aggregate_type: "charge",
    aggregate_id: charge.id,
    event_type: "charge.intent_created",
    payload: {
      provider: intent.provider,
      provider_charge_id: intent.providerChargeId,
      billing_type: input.billingType,
      nosso_numero: intent.nossoNumero ?? null,
    },
  });

  return { charge: updated, intent };
}

export async function syncChargePaymentStatus(
  supabase: Client,
  input: {
    tenantId: string;
    chargeId: string;
    forceStatus?: "pending" | "paid" | "cancelled" | "overdue";
  },
) {
  const { data: charge, error } = await supabase
    .from("charge")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.chargeId)
    .single();
  if (error || !charge) throw error ?? new Error("cobrança não encontrada");
  if (!charge.provider || !charge.provider_charge_id) {
    throw new Error("cobrança sem intent de pagamento");
  }

  const gateway = getPaymentGateway(charge.provider as ChargeProvider, paymentGatewayDepsFromEnv());
  const result = await gateway.syncStatus({
    providerChargeId: charge.provider_charge_id,
    hint: {
      forceStatus: input.forceStatus,
      nossoNumero: charge.nosso_numero ?? undefined,
    },
  });

  if (result.status === "paid") {
    const method = billingTypeToPaymentMethod((charge.billing_type as BillingType) ?? "pix");
    const { data: settled, error: settleError } = await supabase.rpc("settle_charge", {
      p_tenant_id: input.tenantId,
      p_charge_id: charge.id,
      p_payment_method: method,
    });
    if (settleError) throw settleError;
    return { charge: settled, gatewayStatus: result.status };
  }

  const nextStatus = mapGatewayStatusToChargeStatus(result.status);
  if (nextStatus !== charge.status && nextStatus !== "pago") {
    const { data: updated, error: updateError } = await supabase
      .from("charge")
      .update({ status: nextStatus })
      .eq("id", charge.id)
      .eq("tenant_id", input.tenantId)
      .select()
      .single();
    if (updateError) throw updateError;
    return { charge: updated, gatewayStatus: result.status };
  }

  return { charge, gatewayStatus: result.status };
}

/**
 * Processa webhook de forma idempotente via payment_webhook_event.
 * `matchKeys` opcional: tenta provider_charge_id e depois nosso_numero (Itaú).
 */
export async function processPaymentWebhook(
  supabase: Client,
  input: {
    tenantId: string;
    event: NormalizedWebhookEvent;
    matchKeys?: string[];
  },
): Promise<{ duplicate: boolean; chargeId: string | null }> {
  const { data: inserted, error: insertError } = await supabase
    .from("payment_webhook_event")
    .insert({
      tenant_id: input.tenantId,
      provider: input.event.provider,
      external_event_id: input.event.externalEventId,
      payload: input.event.raw as Json,
    })
    .select()
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      return { duplicate: true, chargeId: null };
    }
    throw insertError;
  }

  let charge: { id: string; billing_type: string | null; status: string } | null = null;

  const { data: byProviderId, error: chargeError } = await supabase
    .from("charge")
    .select("id, billing_type, status")
    .eq("tenant_id", input.tenantId)
    .eq("provider", input.event.provider)
    .eq("provider_charge_id", input.event.providerChargeId)
    .maybeSingle();
  if (chargeError) throw chargeError;
  charge = byProviderId;

  if (!charge && input.matchKeys?.length) {
    for (const key of input.matchKeys) {
      const { data: byNosso } = await supabase
        .from("charge")
        .select("id, billing_type, status")
        .eq("tenant_id", input.tenantId)
        .eq("provider", input.event.provider)
        .eq("nosso_numero", key)
        .maybeSingle();
      if (byNosso) {
        charge = byNosso;
        break;
      }
      const { data: byProviderKey } = await supabase
        .from("charge")
        .select("id, billing_type, status")
        .eq("tenant_id", input.tenantId)
        .eq("provider", input.event.provider)
        .eq("provider_charge_id", key)
        .maybeSingle();
      if (byProviderKey) {
        charge = byProviderKey;
        break;
      }
    }
  }

  if (!charge) {
    await supabase
      .from("payment_webhook_event")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", inserted!.id);
    return { duplicate: false, chargeId: null };
  }

  if (input.event.status === "paid" && charge.status !== "pago") {
    const method = billingTypeToPaymentMethod(
      input.event.billingType ?? (charge.billing_type as BillingType) ?? "pix",
    );
    const { error: settleError } = await supabase.rpc("settle_charge", {
      p_tenant_id: input.tenantId,
      p_charge_id: charge.id,
      p_payment_method: method,
    });
    if (settleError) throw settleError;
  } else if (input.event.status === "cancelled" || input.event.status === "overdue") {
    const next = mapGatewayStatusToChargeStatus(input.event.status);
    await supabase
      .from("charge")
      .update({ status: next })
      .eq("id", charge.id)
      .eq("tenant_id", input.tenantId)
      .neq("status", "pago");
  }

  await supabase
    .from("payment_webhook_event")
    .update({
      charge_id: charge.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", inserted!.id);

  return { duplicate: false, chargeId: charge.id };
}
