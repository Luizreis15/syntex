/**
 * Adaptador Itaú Bolecode — Syntex nunca fala mTLS com o Itaú.
 * Toda emissão/consulta real passa pelo serviço `itau-bridge-veramo` (Railway),
 * o mesmo do Veramo: BRIDGE_URL + BRIDGE_ACCESS_TOKEN → POST /v1/charges.
 * Sem ITAU_REAL_CHARGE_ENABLED (ou sem bridge) → mock determinístico.
 */

import type {
  CreatePaymentIntentInput,
  PaymentGateway,
  PaymentIntentResult,
  SyncPaymentInput,
} from "./types";
import {
  generateNossoNumero,
  isItauBolePaid,
  resolvePixTransactionId,
  validateItauPayerAddress,
  validateItauTenantConfig,
  type ItauPayerAddress,
  type ItauTenantConfig,
} from "./itau-utils";

export interface ItauBridgeConfig {
  /** Quando false (default), emite mock sem rede — útil em DEV/staging. */
  realEnabled?: boolean;
  bridgeUrl?: string;
  bridgeToken?: string;
  fetchImpl?: typeof fetch;
}

export class ItauBolecodePaymentGateway implements PaymentGateway {
  readonly provider = "itau_bolecode" as const;
  private readonly realEnabled: boolean;
  private readonly bridgeUrl: string | undefined;
  private readonly bridgeToken: string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(config: ItauBridgeConfig = {}) {
    this.realEnabled = config.realEnabled === true;
    this.bridgeUrl = config.bridgeUrl;
    this.bridgeToken = config.bridgeToken;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const nossoNumero = generateNossoNumero(input.chargeId);
    const useBridge =
      this.realEnabled && Boolean(this.bridgeUrl) && Boolean(this.bridgeToken);

    if (!useBridge) {
      return this.mockIntent(input, nossoNumero);
    }

    const itau = input.itau;
    const cfgErrors = validateItauTenantConfig(itau);
    if (cfgErrors.length) {
      throw new Error(`Tenant sem config Itaú: ${cfgErrors.join("; ")}`);
    }

    const address = input.customer.address;
    const addrErrors = validateItauPayerAddress(address);
    if (addrErrors.length) {
      throw new Error(`Empresa sem endereço para Itaú: ${addrErrors.join("; ")}`);
    }

    const cnpj = (input.customer.cnpj ?? "").replace(/\D/g, "");
    if (!cnpj) throw new Error("CNPJ do pagador é obrigatório para Itaú");

    const body = {
      amount: input.amount,
      due_date: input.dueDate,
      nosso_numero: nossoNumero,
      correlation_id: input.chargeId,
      payer: {
        nome: input.customer.name,
        tipo_pessoa: "J",
        cnpj,
        endereco: {
          logradouro: address!.street,
          bairro: address!.neighborhood,
          cidade: address!.city,
          uf: address!.state.toUpperCase(),
          cep: address!.zip.replace(/\D/g, ""),
        },
      },
      beneficiario_id: itau!.beneficiarioId,
      pix_key: itau!.pixKey,
      carteira_code: itau!.carteiraCode,
      texto_ref: `Syntex ${input.chargeId}`.slice(0, 80),
      mensagem: `Cobrança Syntex ${input.billingType}`,
      billing_type: input.billingType === "pix" ? "PIX" : "BOLETO",
    };

    const res = await this.fetchImpl(`${this.bridgeUrl!.replace(/\/$/, "")}/v1/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-token": this.bridgeToken!,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const err = (data.error as string) ?? `HTTP ${res.status}`;
      throw new Error(`Bridge Itaú: ${err}`);
    }

    if (data.status === "processing") {
      return {
        provider: "itau_bolecode",
        providerChargeId: `ITAU-PENDING-${nossoNumero}`,
        status: "pending",
        nossoNumero,
        raw: { ...data, processing: true },
      };
    }

    const pixCopyPaste = (data.pix_copy_paste as string) ?? undefined;
    const bridgeTxid = (data.txid as string) ?? null;
    const providerChargeId =
      (data.provider_charge_id as string) ??
      resolvePixTransactionId(pixCopyPaste, bridgeTxid) ??
      `ITAU-${nossoNumero}`;

    return {
      provider: "itau_bolecode",
      providerChargeId,
      status: "pending",
      pixCopyPaste,
      boletoUrl: (data.boleto_url as string) ?? undefined,
      barcode: (data.codigo_barras as string) ?? undefined,
      nossoNumero: (data.nosso_numero as string) ?? nossoNumero,
      raw: data,
    };
  }

  async syncStatus(input: SyncPaymentInput): Promise<PaymentIntentResult> {
    if (input.hint?.forceStatus) {
      return {
        provider: "itau_bolecode",
        providerChargeId: input.providerChargeId,
        status: input.hint.forceStatus,
        nossoNumero: input.hint.nossoNumero,
        raw: { forced: true },
      };
    }

    const useBridge =
      this.realEnabled && Boolean(this.bridgeUrl) && Boolean(this.bridgeToken);
    if (!useBridge) {
      return {
        provider: "itau_bolecode",
        providerChargeId: input.providerChargeId,
        status: "pending",
        nossoNumero: input.hint?.nossoNumero,
        raw: { mock: true },
      };
    }

    const nosso = input.hint?.nossoNumero;
    if (!nosso) {
      throw new Error("sync Itaú exige hint.nossoNumero");
    }

    const res = await this.fetchImpl(
      `${this.bridgeUrl!.replace(/\/$/, "")}/v1/charge-status?nosso_numero=${encodeURIComponent(nosso)}`,
      {
        headers: { "x-bridge-token": this.bridgeToken! },
      },
    );
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(`Bridge sync Itaú: ${(data.error as string) ?? res.status}`);
    }

    const paid = isItauBolePaid(data);
    return {
      provider: "itau_bolecode",
      providerChargeId: input.providerChargeId,
      status: paid ? "paid" : "pending",
      nossoNumero: nosso,
      raw: data,
    };
  }

  private mockIntent(
    input: CreatePaymentIntentInput,
    nossoNumero: string,
  ): PaymentIntentResult {
    const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    const txid = `${rand}${String(Date.now())}`.slice(0, 32).padEnd(32, "0");
    const providerChargeId = `ITAU-MOCK-${nossoNumero}-${rand}`;

    const base: PaymentIntentResult = {
      provider: "itau_bolecode",
      providerChargeId,
      status: "pending",
      nossoNumero,
      raw: {
        mock: true,
        provider: "itau_bolecode",
        charge_id: input.chargeId,
        billing_type: input.billingType,
        nosso_numero: nossoNumero,
        txid,
      },
    };

    if (input.billingType === "pix") {
      return {
        ...base,
        pixCopyPaste: `MOCK:ITAU:PIX:${txid}:AMT:${input.amount.toFixed(2)}:DUE:${input.dueDate}`,
      };
    }

    return {
      ...base,
      boletoUrl: `MOCK.${nossoNumero} LINHA.DIGITAVEL ${input.dueDate}`,
      barcode: "34191912300000350001751234567890124345678901",
    };
  }
}

export type { ItauTenantConfig, ItauPayerAddress };
