import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@syntex/database";
import {
  parseAsaasWebhook,
  parseItauWebhook,
  parseStubWebhook,
  type ChargeProvider,
  type NormalizedWebhookEvent,
} from "@syntex/payments";
import { processPaymentWebhook } from "@/lib/domain/payment-intent";

/**
 * Webhook de pagamento.
 * - stub: body inclui tenant_id
 * - asaas: header `asaas-access-token` = ASAAS_WEBHOOK_TOKEN
 * - itau_bolecode: header `x-itau-webhook-token` ou `?token=` = ITAU_WEBHOOK_TOKEN
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const provider = params.provider as ChargeProvider;
  if (provider !== "stub" && provider !== "asaas" && provider !== "itau_bolecode") {
    return NextResponse.json({ error: "provider desconhecido" }, { status: 404 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const admin = createSupabaseAdminClient();

  let event: NormalizedWebhookEvent;
  let tenantId: string;
  let matchKeys: string[] | undefined;

  try {
    if (provider === "stub") {
      tenantId = String(payload.tenant_id ?? "");
      if (!tenantId) {
        return NextResponse.json({ error: "tenant_id obrigatório no payload stub" }, { status: 422 });
      }
      event = parseStubWebhook(payload);
    } else if (provider === "asaas") {
      const expected = process.env.ASAAS_WEBHOOK_TOKEN;
      const token = request.headers.get("asaas-access-token");
      if (expected && token !== expected) {
        return NextResponse.json({ error: "token inválido" }, { status: 401 });
      }

      const parsed = parseAsaasWebhook(payload);
      event = { ...parsed, billingType: parsed.billingType };

      const { data: charge } = await admin
        .from("charge")
        .select("tenant_id")
        .eq("provider", "asaas")
        .eq("provider_charge_id", event.providerChargeId)
        .maybeSingle();

      if (!charge) {
        return NextResponse.json({ received: true, chargeFound: false });
      }
      tenantId = charge.tenant_id;
    } else {
      const expected = process.env.ITAU_WEBHOOK_TOKEN;
      const token =
        request.headers.get("x-itau-webhook-token") ??
        request.nextUrl.searchParams.get("token");
      if (expected && token !== expected) {
        return NextResponse.json({ error: "token inválido" }, { status: 401 });
      }

      const parsed = parseItauWebhook(payload);
      event = {
        provider: parsed.provider,
        externalEventId: parsed.externalEventId,
        providerChargeId: parsed.providerChargeId,
        status: parsed.status,
        billingType: parsed.billingType,
        raw: parsed.raw,
      };
      matchKeys = parsed.matchKeys;

      let charge: { tenant_id: string } | null = null;
      for (const key of matchKeys) {
        const { data: byProvider } = await admin
          .from("charge")
          .select("tenant_id")
          .eq("provider", "itau_bolecode")
          .eq("provider_charge_id", key)
          .maybeSingle();
        if (byProvider) {
          charge = byProvider;
          break;
        }
        const { data: byNosso } = await admin
          .from("charge")
          .select("tenant_id")
          .eq("provider", "itau_bolecode")
          .eq("nosso_numero", key)
          .maybeSingle();
        if (byNosso) {
          charge = byNosso;
          break;
        }
      }

      if (!charge) {
        return NextResponse.json({ received: true, chargeFound: false });
      }
      tenantId = charge.tenant_id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "payload inválido";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    const result = await processPaymentWebhook(admin, { tenantId, event, matchKeys });
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      chargeId: result.chargeId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha no webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
