/**
 * Mapeamento puro Asaas → status da porta Syntex (portado do Veramo).
 * Testável sem rede/DB.
 */

import type { GatewayPaymentStatus, NormalizedWebhookEvent } from "./types";

export type AsaasMappedStatus = "paid" | "overdue" | "cancelled";

export const ASAAS_EVENT_TO_STATUS: Record<string, AsaasMappedStatus | null> = {
  PAYMENT_CONFIRMED: "paid",
  PAYMENT_RECEIVED: "paid",
  PAYMENT_OVERDUE: "overdue",
  PAYMENT_DELETED: "cancelled",
  PAYMENT_REFUNDED: "cancelled",
  PAYMENT_CHARGEBACK_REQUESTED: "cancelled",
  PAYMENT_CREATED: null,
  PAYMENT_UPDATED: null,
};

export const ASAAS_PAYMENT_STATUS_MAP: Record<string, GatewayPaymentStatus> = {
  PENDING: "pending",
  RECEIVED: "paid",
  CONFIRMED: "paid",
  OVERDUE: "overdue",
  REFUNDED: "cancelled",
  RECEIVED_IN_CASH: "paid",
  REFUND_REQUESTED: "cancelled",
  CHARGEBACK_REQUESTED: "cancelled",
  CHARGEBACK_DISPUTE: "cancelled",
  AWAITING_CHARGEBACK_REVERSAL: "cancelled",
  DUNNING_REQUESTED: "overdue",
  DUNNING_RECEIVED: "paid",
  AWAITING_RISK_ANALYSIS: "pending",
};

export function mapAsaasEventToStatus(event: string): AsaasMappedStatus | null {
  return ASAAS_EVENT_TO_STATUS[event] ?? null;
}

export function mapAsaasPaymentStatus(status: string): GatewayPaymentStatus {
  return ASAAS_PAYMENT_STATUS_MAP[status] ?? "pending";
}

/** Chave idempotente por cobrança Asaas + tipo de evento. */
export function asaasProviderTransactionKey(paymentId: string, event: string): string {
  return `${paymentId}:${event}`;
}

/**
 * Converte payload de webhook Asaas no evento normalizado da porta.
 * tenant_id não vem no payload — a rota resolve via provider_charge_id.
 */
export function parseAsaasWebhook(payload: Record<string, unknown>): Omit<
  NormalizedWebhookEvent,
  "billingType"
> & { billingType?: NormalizedWebhookEvent["billingType"] } {
  const event = String(payload.event ?? "");
  const payment = (payload.payment ?? {}) as Record<string, unknown>;
  const paymentId = String(payment.id ?? "");
  if (!event || !paymentId) {
    throw new Error("webhook Asaas inválido: event e payment.id são obrigatórios");
  }

  const mapped = mapAsaasEventToStatus(event);
  const status: GatewayPaymentStatus = mapped ?? "pending";
  const billingRaw = String(payment.billingType ?? "").toUpperCase();

  return {
    provider: "asaas",
    externalEventId: asaasProviderTransactionKey(paymentId, event),
    providerChargeId: paymentId,
    status,
    billingType: billingRaw === "BOLETO" ? "boleto" : billingRaw === "PIX" ? "pix" : undefined,
    raw: payload,
  };
}
