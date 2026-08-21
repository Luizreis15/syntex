import type { ChargeProvider, PaymentGateway } from "./types";
import type { AsaasConfig } from "./asaas";
import type { ItauBridgeConfig } from "./itau";
import { StubPaymentGateway } from "./stub";
import { AsaasPaymentGateway } from "./asaas";
import { ItauBolecodePaymentGateway } from "./itau";

const stub = new StubPaymentGateway();

export interface PaymentGatewayDeps {
  asaas?: AsaasConfig;
  itau?: ItauBridgeConfig;
}

/**
 * Resolve o adaptador pelo provider do tenant.
 * Asaas exige `deps.asaas.apiKey`. Itaú usa mock por padrão; bridge com `realEnabled`.
 */
export function getPaymentGateway(
  provider: ChargeProvider,
  deps: PaymentGatewayDeps = {},
): PaymentGateway {
  switch (provider) {
    case "stub":
      return stub;
    case "asaas":
      if (!deps.asaas?.apiKey) {
        throw new Error(
          "Provider asaas sem ASAAS_API_KEY. Configure o segredo ou use default_charge_provider=stub.",
        );
      }
      return new AsaasPaymentGateway(deps.asaas);
    case "itau_bolecode":
      return new ItauBolecodePaymentGateway(deps.itau ?? {});
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Provider desconhecido: ${_exhaustive}`);
    }
  }
}

export * from "./types";
export { StubPaymentGateway, parseStubWebhook } from "./stub";
export { AsaasPaymentGateway, type AsaasConfig } from "./asaas";
export {
  parseAsaasWebhook,
  mapAsaasEventToStatus,
  mapAsaasPaymentStatus,
  asaasProviderTransactionKey,
  ASAAS_EVENT_TO_STATUS,
} from "./asaas-event-map";
export { ItauBolecodePaymentGateway, type ItauBridgeConfig } from "./itau";
export {
  parseItauWebhook,
  itauProviderTransactionKey,
} from "./itau-event-map";
export {
  generateNossoNumero,
  isItauBolePaid,
  validateItauTenantConfig,
  validateItauPayerAddress,
  extractPixTxidFromEMV,
  resolvePixTransactionId,
} from "./itau-utils";
