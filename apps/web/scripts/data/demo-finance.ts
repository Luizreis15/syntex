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

/** Competências válidas sob a CCT 2025 (valid_from 2025-05-01, valid_until 2026-04-30). */
const COMPETENCES = [
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

export function buildOpenChargePlan(input: {
  companyCount: number;
  referenceDate: string;
}): DemoChargePlan[] {
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
      competenceYm: COMPETENCES[i % COMPETENCES.length]!,
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
