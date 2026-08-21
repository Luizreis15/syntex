/** Formatação brasileira centralizada (design/SYNTEX-UI.md §13) — nunca à mão num componente. */

/**
 * Aceita com ou sem DDD, celular (9 dígitos) ou fixo (8 dígitos).
 * "11987654321" -> "(11) 98765-4321". "1123456789" -> "(11) 2345-6789".
 * Sem DDD reconhecível (menos de 10 dígitos), devolve só o número separado.
 */
export function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 9) {
    return digits.replace(/(\d{5})(\d{4})/, "$1-$2");
  }
  if (digits.length === 8) {
    return digits.replace(/(\d{4})(\d{4})/, "$1-$2");
  }
  return value;
}
