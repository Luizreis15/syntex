import type {
  CreatePaymentIntentInput,
  PaymentGateway,
  PaymentIntentResult,
  SyncPaymentInput,
} from "./types";
import { mapAsaasPaymentStatus } from "./asaas-event-map";

export interface AsaasConfig {
  apiKey: string;
  sandbox?: boolean;
  /** Injável nos testes — default: global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Adaptador Asaas — lógica alinhada ao Veramo (create customer + payment + pixQrCode).
 */
export class AsaasPaymentGateway implements PaymentGateway {
  readonly provider = "asaas" as const;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: AsaasConfig) {
    if (!config.apiKey) throw new Error("ASAAS_API_KEY ausente");
    this.apiKey = config.apiKey;
    this.baseUrl = config.sandbox
      ? "https://sandbox.asaas.com/api/v3"
      : "https://www.asaas.com/api/v3";
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      access_token: this.apiKey,
      "User-Agent": "syntex/1.0",
    };
  }

  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const cnpj = (input.customer.cnpj ?? "").replace(/\D/g, "");
    if (!cnpj) throw new Error("CNPJ do cliente é obrigatório para Asaas");

    let customerId = input.customer.asaasCustomerId ?? null;
    if (!customerId) {
      const custRes = await this.fetchImpl(`${this.baseUrl}/customers`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          name: input.customer.name,
          cpfCnpj: cnpj,
          email: input.customer.email ?? undefined,
          groupName: "Syntex",
        }),
      });
      const custData = (await custRes.json()) as {
        id?: string;
        errors?: { description?: string }[];
      };
      if (!custRes.ok || !custData.id) {
        throw new Error(
          `Erro ao criar cliente Asaas: ${custData.errors?.[0]?.description ?? custRes.status}`,
        );
      }
      customerId = custData.id;
    }

    const billingType = input.billingType === "pix" ? "PIX" : "BOLETO";
    const payRes = await this.fetchImpl(`${this.baseUrl}/payments`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        customer: customerId,
        billingType,
        value: input.amount,
        dueDate: input.dueDate,
        description: `Syntex charge ${input.chargeId}`.slice(0, 500),
        externalReference: input.chargeId,
      }),
    });
    const payData = (await payRes.json()) as {
      id?: string;
      status?: string;
      invoiceUrl?: string;
      bankSlipUrl?: string;
      identificationField?: string;
      errors?: { description?: string }[];
    };
    if (!payRes.ok || !payData.id) {
      throw new Error(`Erro Asaas: ${payData.errors?.[0]?.description ?? payRes.status}`);
    }

    let pixCopyPaste: string | undefined;
    if (billingType === "PIX") {
      const pixRes = await this.fetchImpl(`${this.baseUrl}/payments/${payData.id}/pixQrCode`, {
        headers: this.headers(),
      });
      if (pixRes.ok) {
        const pixData = (await pixRes.json()) as { payload?: string };
        pixCopyPaste = pixData.payload ?? undefined;
      }
    }

    return {
      provider: "asaas",
      providerChargeId: payData.id,
      status: mapAsaasPaymentStatus(payData.status ?? "PENDING"),
      pixCopyPaste,
      boletoUrl: payData.bankSlipUrl ?? undefined,
      barcode: payData.identificationField ?? undefined,
      paymentLink: payData.invoiceUrl ?? undefined,
      customerExternalId: customerId,
      raw: { asaasPaymentId: payData.id, customerId },
    };
  }

  async syncStatus(input: SyncPaymentInput): Promise<PaymentIntentResult> {
    if (input.hint?.forceStatus) {
      return {
        provider: "asaas",
        providerChargeId: input.providerChargeId,
        status: input.hint.forceStatus,
        raw: { forced: true },
      };
    }

    const res = await this.fetchImpl(`${this.baseUrl}/payments/${input.providerChargeId}`, {
      headers: this.headers(),
    });
    const data = (await res.json()) as {
      id?: string;
      status?: string;
      invoiceUrl?: string;
      bankSlipUrl?: string;
      identificationField?: string;
      errors?: { description?: string }[];
    };
    if (!res.ok) {
      throw new Error(`Asaas sync falhou: ${data.errors?.[0]?.description ?? res.status}`);
    }

    return {
      provider: "asaas",
      providerChargeId: data.id ?? input.providerChargeId,
      status: mapAsaasPaymentStatus(data.status ?? "PENDING"),
      boletoUrl: data.bankSlipUrl ?? undefined,
      barcode: data.identificationField ?? undefined,
      paymentLink: data.invoiceUrl ?? undefined,
      raw: { status: data.status },
    };
  }
}
