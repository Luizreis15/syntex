/** Formatação brasileira centralizada (design/SYNTEX-UI.md §13) — nunca à mão num componente. */

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Recebe o valor já em percentual (1.5 -> "1,50%"), não uma fração de 1. */
export function formatPercentual(value: number): string {
  return `${percentFormatter.format(value)}%`;
}
