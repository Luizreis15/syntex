import type { DomainState } from "@/components/ui/syntex-status";

export interface RawRepresentationPeriod {
  validFrom: string;
  validUntil: string | null;
  status: DomainState;
}

export interface TimelinePeriod {
  from: string;
  until: string | null;
  state: DomainState;
}

/**
 * Achata um conjunto de linhas de union_representation (possivelmente
 * sobrepostas) numa linha do tempo sem sobreposição, para alimentar
 * SyntexValidityBand. Mesma regra de agregação de resolveRepresentation:
 * um único período vigente mantém seu próprio status; mais de um vigente no
 * mesmo intervalo vira 'disputada' — nunca escolhe um lado.
 */
export function computeRepresentationTimeline(rows: RawRepresentationPeriod[], today: string): TimelinePeriod[] {
  if (rows.length === 0) return [];

  const boundaries = new Set<string>();
  for (const row of rows) {
    boundaries.add(row.validFrom);
    boundaries.add(row.validUntil ?? today);
  }
  const sorted = Array.from(boundaries).sort();

  const periods: TimelinePeriod[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]!;
    const end = sorted[i + 1]!;
    const active = rows.filter((row) => row.validFrom <= start && (row.validUntil === null || row.validUntil >= end));
    if (active.length === 0) continue;

    const state: DomainState = active.length > 1 ? "disputada" : active[0]!.status;
    // Só termina em aberto (null) quando o próprio período final coincide
    // com `today` E uma das linhas que o formam de fato não tem valid_until
    // — não quando `today` calha de bater com uma fronteira qualquer.
    const isOpenEnded = end === today && active.some((row) => row.validUntil === null);
    const until = isOpenEnded ? null : end;

    const last = periods[periods.length - 1];
    if (last && last.state === state && last.until === start) {
      last.until = until;
    } else {
      periods.push({ from: start, until, state });
    }
  }

  return periods;
}
