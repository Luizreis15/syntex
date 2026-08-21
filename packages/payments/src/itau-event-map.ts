/**
 * Normalização de webhooks Itaú (PIX BACEN + liquidação boleto) → porta Syntex.
 */

import type { NormalizedWebhookEvent } from "./types";
import { isItauBolePaid } from "./itau-utils";

export function itauProviderTransactionKey(ref: string, kind: string): string {
  return `itau:${ref}:${kind}`;
}

/**
 * Aceita:
 * - PIX: `{ pix: [{ txid, ... }] }`
 * - Boleto: `{ boletos: [{ numeroNossoNumero, tipoLiquidacao, ... }] }`
 * - Stub/teste: `{ event_id, provider_charge_id|nosso_numero, status }`
 */
export function parseItauWebhook(payload: Record<string, unknown>): Omit<
  NormalizedWebhookEvent,
  "billingType"
> & {
  billingType?: NormalizedWebhookEvent["billingType"];
  nossoNumero?: string;
  matchKeys: string[];
} {
  // Contrato de teste / bridge
  if (payload.event_id && (payload.provider_charge_id || payload.nosso_numero)) {
    const statusRaw = String(payload.status ?? "pending");
    const status =
      statusRaw === "paid" || statusRaw === "cancelled" || statusRaw === "overdue"
        ? statusRaw
        : "pending";
    const providerChargeId = String(payload.provider_charge_id ?? payload.nosso_numero);
    const nossoNumero = payload.nosso_numero ? String(payload.nosso_numero) : undefined;
    return {
      provider: "itau_bolecode",
      externalEventId: String(payload.event_id),
      providerChargeId,
      status,
      billingType: payload.billing_type === "boleto" ? "boleto" : "pix",
      nossoNumero,
      matchKeys: [providerChargeId, nossoNumero].filter(Boolean) as string[],
      raw: payload,
    };
  }

  const pix = payload.pix;
  if (Array.isArray(pix) && pix.length > 0) {
    const entry = pix[0] as Record<string, unknown>;
    const txid = String(entry.txid ?? "");
    if (!txid) throw new Error("webhook Itaú PIX sem txid");
    return {
      provider: "itau_bolecode",
      externalEventId: itauProviderTransactionKey(txid, "pix"),
      providerChargeId: txid,
      status: "paid",
      billingType: "pix",
      matchKeys: [txid],
      raw: payload,
    };
  }

  const boletos = payload.boletos;
  if (Array.isArray(boletos) && boletos.length > 0) {
    const b = boletos[0] as Record<string, unknown>;
    const nosso = String(b.numeroNossoNumero ?? b.nosso_numero ?? "").replace(/\D/g, "");
    if (!nosso) throw new Error("webhook Itaú boleto sem nosso_numero");
    const paid =
      isItauBolePaid({ boletos }) ||
      ["LIQUIDADO", "PAGO", "BAIXA_EFETIVA", "06", "17", "95"].includes(
        String(b.tipoLiquidacao ?? b.tipo_liquidacao ?? "")
          .trim()
          .toUpperCase(),
      );
    return {
      provider: "itau_bolecode",
      externalEventId: itauProviderTransactionKey(nosso, "boleto"),
      providerChargeId: nosso,
      status: paid ? "paid" : "pending",
      billingType: "boleto",
      nossoNumero: nosso.padStart(8, "0").slice(-8),
      matchKeys: [nosso, nosso.padStart(8, "0").slice(-8)],
      raw: payload,
    };
  }

  throw new Error("webhook Itaú inválido: espere pix[], boletos[] ou event_id");
}
