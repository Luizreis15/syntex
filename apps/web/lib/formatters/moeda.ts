/** Formatação brasileira centralizada (design/SYNTEX-UI.md §13) — nunca à mão num componente. */
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatMoeda(value: number): string {
  return currencyFormatter.format(value);
}
