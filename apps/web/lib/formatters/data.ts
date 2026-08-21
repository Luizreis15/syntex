/** Formatação brasileira centralizada (design/SYNTEX-UI.md §13) — nunca à mão num componente. */

/** "2026-08-19" -> "19/08/2026". Espera data ISO (YYYY-MM-DD), sem hora. */
export function formatData(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/** "2026-08-19T14:32:00Z" -> "19/08/2026 14:32". */
export function formatDataHora(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  return dateFormatter.format(date).replace(",", "");
}
