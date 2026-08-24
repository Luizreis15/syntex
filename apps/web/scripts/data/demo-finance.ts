/**
 * Plano financeiro DEMO — obligation + charge alinhados ao schema.
 * Não cria conciliação/journal (sem contabilidade falsa).
 */

import { addDaysIso } from "../lib/seed-generators";

export const DEMO_OPEN_CHARGES = 90;
export const DEMO_PENDING_CHARGES = 65;
export const DEMO_OVERDUE_CHARGES = 25;

const AMOUNTS = [80, 150, 420, 980, 2400, 5800, 12400] as const;
const PENDING_OFFSETS = [5, 10, 15, 20, 30] as const;
const OVERDUE_OFFSETS = [3, 8, 17, 30, 60] as const;

/** Fallback histórico (CCT 2025) — preferir `agreementValidFrom`/`agreementValidUntil`. */
const COMPETENCES_LEGACY_2025 = [
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
] as const;

export interface DemoChargePlan {
  companyIndex: number;
  competenceYm: string;
  amount: number;
  dueDate: string;
  status: "pendente" | "vencido";
  obligationStatus: "cobrada";
}

/**
 * Meses YYYY-MM inclusivos entre validFrom e o menor entre validUntil e upToDate.
 * Usado para competências de cobrança DEMO sob a CCT vigente na referência (C3).
 */
export function listCompetenceMonthsInclusive(
  validFrom: string,
  validUntil: string,
  upToDate: string,
): string[] {
  const startYm = validFrom.slice(0, 7);
  const endYm = (validUntil < upToDate ? validUntil : upToDate).slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(startYm) || !/^\d{4}-\d{2}$/.test(endYm)) {
    throw new Error(`intervalo de competência inválido: ${validFrom}…${validUntil} @ ${upToDate}`);
  }
  if (startYm > endYm) return [];

  const months: string[] = [];
  let [y, m] = startYm.split("-").map(Number) as [number, number];
  const [endY, endM] = endYm.split("-").map(Number) as [number, number];
  while (y < endY || (y === endY && m <= endM)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

/** Escolhe CCT cuja vigência cobre a data de referência (seed C3). */
export function pickAgreementCoveringDate<
  T extends { valid_from: string; valid_until: string },
>(agreements: T[], referenceDate: string): T | undefined {
  return agreements.find(
    (a) => a.valid_from <= referenceDate && a.valid_until >= referenceDate,
  );
}

export function buildOpenChargePlan(input: {
  companyCount: number;
  referenceDate: string;
  /** Vigência da CCT usada nas obrigações (C3). */
  agreementValidFrom?: string;
  agreementValidUntil?: string;
}): DemoChargePlan[] {
  const competences =
    input.agreementValidFrom && input.agreementValidUntil
      ? listCompetenceMonthsInclusive(
          input.agreementValidFrom,
          input.agreementValidUntil,
          input.referenceDate,
        )
      : [...COMPETENCES_LEGACY_2025];

  if (competences.length === 0) {
    throw new Error(
      "buildOpenChargePlan: nenhuma competência na vigência da CCT para a data de referência",
    );
  }

  const plans: DemoChargePlan[] = [];
  for (let i = 0; i < DEMO_OPEN_CHARGES; i++) {
    const overdue = i < DEMO_OVERDUE_CHARGES;
    const offset = overdue
      ? OVERDUE_OFFSETS[i % OVERDUE_OFFSETS.length]!
      : PENDING_OFFSETS[i % PENDING_OFFSETS.length]!;
    const dueDate = overdue
      ? addDaysIso(input.referenceDate, -offset)
      : addDaysIso(input.referenceDate, offset);

    plans.push({
      companyIndex: i % input.companyCount,
      competenceYm: competences[i % competences.length]!,
      amount: AMOUNTS[i % AMOUNTS.length]!,
      dueDate,
      status: overdue ? "vencido" : "pendente",
      obligationStatus: "cobrada",
    });
  }
  return plans;
}

export function competenceYmToDate(ym: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!match) throw new Error(`competência inválida: ${ym}`);
  return `${match[1]}-${match[2]}-01`;
}
