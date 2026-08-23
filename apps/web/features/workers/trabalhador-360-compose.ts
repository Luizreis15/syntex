import { formatData } from "@/lib/formatters/data";
import {
  DEMO_TRAB_BENEFICIOS_COUNT,
  DEMO_TRAB_DEPENDENTES,
  DEMO_TRAB_PROX_ATENDIMENTO,
} from "@/features/workers/demo-trabalhador-360";

export type SummaryTone = "ok" | "syntex" | "teal" | "amber" | "critical";

export interface TrabalhadorSummaryItem {
  label: string;
  value: string;
  hint: string;
  tone: SummaryTone;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function membershipYearsLabel(validFrom: string | null, now = new Date()): string | null {
  if (!validFrom) return null;
  const from = new Date(validFrom.slice(0, 10) + "T12:00:00");
  if (Number.isNaN(from.getTime())) return null;
  const years = Math.max(0, Math.floor((now.getTime() - from.getTime()) / (365.25 * 86_400_000)));
  if (years <= 0) return "menos de 1 ano";
  return years === 1 ? "1 ano" : `${years} anos`;
}

export function buildTrabalhadorSummary(input: {
  membershipStatus: string | null;
  membershipSince: string | null;
  hasActiveEmployment: boolean;
}): TrabalhadorSummaryItem[] {
  const associadoAtivo = input.membershipStatus === "ativo";
  return [
    {
      label: "Associação",
      value: associadoAtivo ? "Ativa" : input.membershipStatus ? input.membershipStatus : "Sem filiação",
      hint: input.membershipSince
        ? `desde ${formatData(input.membershipSince)}`
        : associadoAtivo
          ? "vigente"
          : "—",
      tone: associadoAtivo ? "ok" : "amber",
    },
    {
      label: "Financeiro",
      value: associadoAtivo ? "Regular" : "—",
      hint: associadoAtivo ? "últ. pgto. · demo" : "sem mensalidade · demo",
      tone: associadoAtivo ? "ok" : "syntex",
    },
    {
      label: "Dependentes",
      value: DEMO_TRAB_DEPENDENTES.value,
      hint: DEMO_TRAB_DEPENDENTES.hint,
      tone: "syntex",
    },
    {
      label: "Benefícios",
      value: DEMO_TRAB_BENEFICIOS_COUNT.value,
      hint: DEMO_TRAB_BENEFICIOS_COUNT.hint,
      tone: "teal",
    },
    {
      label: "Próx. atendimento",
      value: DEMO_TRAB_PROX_ATENDIMENTO.value,
      hint: DEMO_TRAB_PROX_ATENDIMENTO.hint,
      tone: "amber",
    },
  ];
}

export function formatEmploymentPeriod(validFrom: string, validUntil: string | null): string {
  const fromYear = validFrom.slice(0, 4);
  if (!validUntil) return `${fromYear} — atual`;
  return `${fromYear} — ${validUntil.slice(0, 4)}`;
}
