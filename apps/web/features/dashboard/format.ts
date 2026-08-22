/** Formatação numérica do dashboard — wrappers locais sobre Intl (pt-BR). */

const inteiro = new Intl.NumberFormat("pt-BR");

export function formatInteiro(value: number): string {
  return inteiro.format(value);
}
