/**
 * Inteligência financeira do Command Center — funções puras sobre cobranças abertas.
 * Não confundir com arrecadação (recebido/realizado).
 */

export interface OpenChargeInput {
  amount: number;
  /** ISO date `YYYY-MM-DD` (ou prefixo). */
  dueDate: string;
  status: string;
}

export type DueBucketKey =
  | "vencidas"
  | "d0_7"
  | "d8_15"
  | "d16_30"
  | "d31_60"
  | "d60_plus";

export interface DueBucket {
  key: DueBucketKey;
  label: string;
  count: number;
  amount: number;
}

export interface ChargeIntel {
  openCount: number;
  openAmount: number;
  overdueCount: number;
  overdueAmount: number;
  dueIn30Count: number;
  dueIn30Amount: number;
  maxAmount: number;
  buckets: DueBucket[];
}

const BUCKET_DEFS: { key: DueBucketKey; label: string }[] = [
  { key: "vencidas", label: "Vencidas" },
  { key: "d0_7", label: "0–7 dias" },
  { key: "d8_15", label: "8–15 dias" },
  { key: "d16_30", label: "16–30 dias" },
  { key: "d31_60", label: "31–60 dias" },
  { key: "d60_plus", label: "60+ dias" },
];

function toUtcDateOnly(input: Date | string): Date {
  if (typeof input === "string") {
    const day = input.slice(0, 10);
    const [y, m, d] = day.split("-").map(Number);
    return new Date(Date.UTC(y!, m! - 1, d!));
  }
  return new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
}

function dueDay(iso: string): Date {
  return toUtcDateOnly(iso);
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function isOpenStatus(status: string): boolean {
  return status === "pendente" || status === "vencido";
}

function isOverdue(row: OpenChargeInput, ref: Date): boolean {
  if (row.status === "vencido") return true;
  return dueDay(row.dueDate).getTime() < ref.getTime();
}

function bucketFor(row: OpenChargeInput, ref: Date): DueBucketKey {
  if (isOverdue(row, ref)) return "vencidas";
  const delta = daysBetween(ref, dueDay(row.dueDate));
  if (delta <= 7) return "d0_7";
  if (delta <= 15) return "d8_15";
  if (delta <= 30) return "d16_30";
  if (delta <= 60) return "d31_60";
  return "d60_plus";
}

/**
 * Agrega cobranças em aberto (pendente | vencido) em relação a `referenceDate`.
 * Rows com outros status são ignoradas.
 */
export function aggregateOpenCharges(
  rows: OpenChargeInput[],
  referenceDate: Date | string = new Date(),
): ChargeIntel {
  const ref = toUtcDateOnly(referenceDate);
  const open = rows.filter((r) => isOpenStatus(r.status));

  const buckets = BUCKET_DEFS.map((def) => ({ ...def, count: 0, amount: 0 }));
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b])) as Record<
    DueBucketKey,
    DueBucket
  >;

  let openAmount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let dueIn30Count = 0;
  let dueIn30Amount = 0;
  let maxAmount = 0;

  for (const row of open) {
    const amount = Number(row.amount) || 0;
    openAmount += amount;
    if (amount > maxAmount) maxAmount = amount;

    const key = bucketFor(row, ref);
    byKey[key]!.count += 1;
    byKey[key]!.amount += amount;

    if (isOverdue(row, ref)) {
      overdueCount += 1;
      overdueAmount += amount;
    } else {
      const delta = daysBetween(ref, dueDay(row.dueDate));
      if (delta >= 1 && delta <= 30) {
        dueIn30Count += 1;
        dueIn30Amount += amount;
      } else if (delta === 0) {
        // vence hoje: conta em 0–7 e em “próx. 30 dias”
        dueIn30Count += 1;
        dueIn30Amount += amount;
      }
    }
  }

  return {
    openCount: open.length,
    openAmount,
    overdueCount,
    overdueAmount,
    dueIn30Count,
    dueIn30Amount,
    maxAmount,
    buckets,
  };
}

/**
 * Ordenação operacional: vencidas primeiro, depois vencimento mais próximo.
 * Não altera `fetchChargesPage` (lista administrativa).
 */
export function sortAttentionCharges<T extends OpenChargeInput>(
  rows: T[],
  referenceDate: Date | string = new Date(),
): T[] {
  const ref = toUtcDateOnly(referenceDate);
  return [...rows].sort((a, b) => {
    const aOver = isOverdue(a, ref) ? 0 : 1;
    const bOver = isOverdue(b, ref) ? 0 : 1;
    if (aOver !== bOver) return aOver - bOver;
    const aDue = dueDay(a.dueDate).getTime();
    const bDue = dueDay(b.dueDate).getTime();
    if (aDue !== bDue) return aDue - bDue;
    return Number(b.amount) - Number(a.amount);
  });
}
