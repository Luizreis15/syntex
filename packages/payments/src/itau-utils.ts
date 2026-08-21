/**
 * Utilitários puros Itaú — portados do Veramo (testáveis sem rede).
 */

/** Nosso número 8 dígitos determinístico a partir do UUID da charge. */
export function generateNossoNumero(chargeId: string): string {
  const hex = chargeId.replace(/-/g, "");
  const parts = [
    parseInt(hex.slice(0, 8), 16),
    parseInt(hex.slice(8, 16), 16),
    parseInt(hex.slice(16, 24), 16),
    parseInt(hex.slice(24, 32), 16),
  ];
  const combined = parts.reduce((acc, v) => acc ^ (Number.isFinite(v) ? v : 0), 0);
  const num = Math.abs(combined) % 100_000_000;
  return String(num).padStart(8, "0");
}

export function extractPixTxidFromEMV(pixCopyPaste: string | null | undefined): string | null {
  if (!pixCopyPaste) return null;
  const match = pixCopyPaste.match(/api\.itau\/pix\/qr\/v\d+\/([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

export function resolvePixTransactionId(
  pixCopyPaste: string | null | undefined,
  bridgeTxid: string | null | undefined,
): string | null {
  const emv = extractPixTxidFromEMV(pixCopyPaste);
  if (emv) return emv;
  if (bridgeTxid && !bridgeTxid.startsWith("BL")) return bridgeTxid;
  return null;
}

const PAID_TEXT = [
  "LIQUIDADO",
  "LIQUIDACAO",
  "LIQUIDADA",
  "PAGO",
  "PAGA",
  "BAIXADA",
  "BAIXADO",
  "BAIXA_EFETIVA",
  "BAIXA_OPERACIONAL",
  "CONCLUIDA",
];

const OPEN_TEXT = ["EM ABERTO", "A VENCER", "ABERTO", "REGISTRADO", "NAO PAGO", "NÃO PAGO"];
const PAID_CODES = new Set(["06", "17", "95"]);

function normalizeToken(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function situationIndicatesPaid(value: unknown): boolean {
  const s = normalizeToken(value);
  if (!s) return false;
  if (OPEN_TEXT.some((o) => s.includes(o))) return false;
  if (PAID_TEXT.some((t) => s.includes(t))) return true;
  return PAID_CODES.has(s);
}

function pickSituation(obj: Record<string, unknown>): unknown {
  return (
    obj.situacao_geral_boleto ??
    obj.situacao_boleto ??
    obj.situacao ??
    obj.status ??
    obj.tipo_liquidacao ??
    obj.tipoLiquidacao ??
    obj.tipo_ocorrencia ??
    obj.tipo_baixa
  );
}

/** Detecção de liquidação sem walk cego em strings (falso positivo em datas/base64). */
export function isItauBolePaid(raw: Record<string, unknown> | null | undefined): boolean {
  if (!raw) return false;
  const items: Record<string, unknown>[] = [];
  if (Array.isArray(raw.data)) {
    for (const item of raw.data) {
      if (item && typeof item === "object") items.push(item as Record<string, unknown>);
    }
  } else if (raw.data && typeof raw.data === "object") {
    items.push(raw.data as Record<string, unknown>);
  } else {
    items.push(raw);
  }

  return items.some((rec) => {
    if (situationIndicatesPaid(pickSituation(rec))) return true;
    const boletos = rec.boletos;
    if (Array.isArray(boletos)) {
      for (const b of boletos) {
        if (b && typeof b === "object") {
          const row = b as Record<string, unknown>;
          if (situationIndicatesPaid(pickSituation(row))) return true;
          if (situationIndicatesPaid(row.tipoLiquidacao ?? row.tipo_liquidacao)) return true;
        }
      }
    }
    return false;
  });
}

export interface ItauTenantConfig {
  beneficiarioId: string;
  pixKey: string;
  carteiraCode: string;
}

export function validateItauTenantConfig(
  config: Partial<ItauTenantConfig> | null | undefined,
): string[] {
  const errors: string[] = [];
  if (!config?.beneficiarioId) errors.push("itau_beneficiario_id ausente");
  if (!config?.pixKey) errors.push("itau_pix_key ausente");
  if (!config?.carteiraCode) errors.push("itau_carteira_code ausente");
  return errors;
}

export interface ItauPayerAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

export function validateItauPayerAddress(
  address: Partial<ItauPayerAddress> | null | undefined,
): string[] {
  const errors: string[] = [];
  if (!address?.street) errors.push("address_street ausente");
  if (!address?.neighborhood) errors.push("address_neighborhood ausente");
  if (!address?.city) errors.push("address_city ausente");
  if (!address?.state || address.state.length !== 2) errors.push("address_state inválido");
  const zip = (address?.zip ?? "").replace(/\D/g, "");
  if (zip.length !== 8) errors.push("address_zip inválido");
  return errors;
}
