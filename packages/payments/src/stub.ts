import type {
  ChargeProvider,
  CreatePaymentIntentInput,
  NormalizedWebhookEvent,
  PaymentGateway,
  PaymentIntentResult,
  SyncPaymentInput,
} from "./types";

/**
 * Adaptador de desenvolvimento — sem rede.
 * providerChargeId = `stub_<chargeId>`.
 * syncStatus com hint.forceStatus = 'paid' simula liquidação.
 */
export class StubPaymentGateway implements PaymentGateway {
  readonly provider: ChargeProvider = "stub";

  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const providerChargeId = `stub_${input.chargeId}`;
    const base: PaymentIntentResult = {
      provider: "stub",
      providerChargeId,
      status: "pending",
      raw: {
        stub: true,
        customer: input.customer.name,
        amount: input.amount,
        dueDate: input.dueDate,
      },
    };

    if (input.billingType === "pix") {
      return {
        ...base,
        pixCopyPaste: `STUBPIX|${input.chargeId}|${input.amount}|${input.dueDate}`,
      };
    }

    return {
      ...base,
      boletoUrl: `https://stub.local/boleto/${input.chargeId}`,
      barcode: `23793${String(Math.abs(hash(input.chargeId)) % 1e10).padStart(10, "0")}00000000`,
    };
  }

  async syncStatus(input: SyncPaymentInput): Promise<PaymentIntentResult> {
    const status = input.hint?.forceStatus ?? "pending";
    return {
      provider: "stub",
      providerChargeId: input.providerChargeId,
      status,
      raw: { stub: true, synced: true },
    };
  }
}

/** Parse do payload de webhook stub (contrato de teste / DEV). */
export function parseStubWebhook(payload: Record<string, unknown>): NormalizedWebhookEvent {
  const externalEventId = String(payload.event_id ?? "");
  const providerChargeId = String(payload.provider_charge_id ?? "");
  const statusRaw = String(payload.status ?? "pending");
  if (!externalEventId || !providerChargeId) {
    throw new Error("webhook stub inválido: event_id e provider_charge_id são obrigatórios");
  }
  const status =
    statusRaw === "paid" || statusRaw === "cancelled" || statusRaw === "overdue"
      ? statusRaw
      : "pending";

  return {
    provider: "stub",
    externalEventId,
    providerChargeId,
    status,
    billingType: payload.billing_type === "boleto" ? "boleto" : "pix",
    raw: payload,
  };
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  return h;
}
