/**
 * Porta de pagamento do Syntex.
 *
 * Vocabulário alinhado ao Veramo (`asaas` | `itau_bolecode`) + `stub` para DEV.
 * Asaas (Lote 5) e Itaú (Lote 6) portam a lógica do Veramo — o domínio só usa a porta.
 */

export type ChargeProvider = "stub" | "asaas" | "itau_bolecode";

export type BillingType = "pix" | "boleto";

/** Status normalizado na porta (independente do status interno da charge). */
export type GatewayPaymentStatus = "pending" | "paid" | "cancelled" | "overdue";

export interface PaymentCustomer {
  name: string;
  cnpj?: string | null;
  email?: string | null;
  /** Reuso do customer Asaas já persistido em company.asaas_customer_id. */
  asaasCustomerId?: string | null;
  /** Endereço do pagador — exigido para emissão real Itaú. */
  address?: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  } | null;
}

export interface CreatePaymentIntentInput {
  tenantId: string;
  chargeId: string;
  amount: number;
  dueDate: string;
  billingType: BillingType;
  customer: PaymentCustomer;
  /** Config Itaú do tenant (só usada pelo adaptador itau_bolecode). */
  itau?: {
    beneficiarioId: string;
    pixKey: string;
    carteiraCode: string;
  };
}

export interface PaymentIntentResult {
  provider: ChargeProvider;
  providerChargeId: string;
  status: GatewayPaymentStatus;
  pixCopyPaste?: string;
  boletoUrl?: string;
  barcode?: string;
  paymentLink?: string;
  nossoNumero?: string;
  /** Persistir em company.asaas_customer_id quando provider=asaas. */
  customerExternalId?: string;
  raw?: Record<string, unknown>;
}

export interface SyncPaymentInput {
  providerChargeId: string;
  /** Metadados opcionais do adaptador (ex.: stub força status; Itaú precisa nossoNumero). */
  hint?: { forceStatus?: GatewayPaymentStatus; nossoNumero?: string };
}

/**
 * Contrato que todo adaptador (stub, Asaas, Itaú) implementa.
 * A aplicação nunca importa Asaas/Itaú direto — só esta porta.
 */
export interface PaymentGateway {
  readonly provider: ChargeProvider;
  createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  syncStatus(input: SyncPaymentInput): Promise<PaymentIntentResult>;
}

/** Evento normalizado de webhook — processado de forma idempotente. */
export interface NormalizedWebhookEvent {
  provider: ChargeProvider;
  externalEventId: string;
  providerChargeId: string;
  status: GatewayPaymentStatus;
  billingType?: BillingType;
  raw: Record<string, unknown>;
}

export function mapGatewayStatusToChargeStatus(
  status: GatewayPaymentStatus,
): "pendente" | "pago" | "cancelado" | "vencido" {
  switch (status) {
    case "paid":
      return "pago";
    case "cancelled":
      return "cancelado";
    case "overdue":
      return "vencido";
    default:
      return "pendente";
  }
}

export function billingTypeToPaymentMethod(billingType: BillingType): "pix" | "boleto" {
  return billingType;
}
