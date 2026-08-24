import { formatData } from "@/lib/formatters/data";
import type { RepresentationListItem } from "@/features/representations/data";

/** Texto de vigência/contexto — conflito nunca elege datas de uma claim. */
export function representationValidityLabel(row: RepresentationListItem): string {
  if (row.hasConflict || row.activeClaimsCount >= 2) {
    return `${row.activeClaimsCount} reivindicações vigentes`;
  }
  if (!row.validFrom) return "—";
  const until = row.validUntil ? formatData(row.validUntil) : "aberta";
  return `${formatData(row.validFrom)} → ${until}`;
}
