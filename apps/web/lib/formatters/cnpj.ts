/** Formatação brasileira centralizada (design/SYNTEX-UI.md §13) — nunca à mão num componente. */
export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").padStart(14, "0");
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

/** Valida o dígito verificador do CNPJ (módulo 11). */
export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;

  const calcCheckDigit = (base: string) => {
    const weights = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base.split("").reduce((acc, digit, i) => acc + Number(digit) * weights[i]!, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base = digits.slice(0, 12);
  const dv1 = calcCheckDigit(base);
  const dv2 = calcCheckDigit(base + dv1);
  return digits === base + String(dv1) + String(dv2);
}
