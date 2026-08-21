/** Formatação brasileira centralizada (design/SYNTEX-UI.md §13) — nunca à mão num componente. */

/** Competência (mês de referência) — "2026-08" ou "2026-08-01" -> "08/2026". */
export function formatCompetencia(value: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month] = match;
  return `${month}/${year}`;
}
