/** Formatação brasileira centralizada (design/SYNTEX-UI.md §13) — nunca à mão num componente. */
export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").padStart(11, "0");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/** Valida o dígito verificador do CPF (módulo 11). */
export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const calcCheckDigit = (base: string) => {
    const weightStart = base.length + 1;
    const sum = base.split("").reduce((acc, digit, i) => acc + Number(digit) * (weightStart - i), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const base = digits.slice(0, 9);
  const dv1 = calcCheckDigit(base);
  const dv2 = calcCheckDigit(base + dv1);
  return digits === base + String(dv1) + String(dv2);
}
