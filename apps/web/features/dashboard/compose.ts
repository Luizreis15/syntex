import { formatInteiro } from "@/features/dashboard/format";
import type { UnionDashboardMetrics } from "@/features/dashboard/data";

export type HeroMetricTone = "default" | "warning" | "danger" | "teal";

export interface HeroMetric {
  key: string;
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: HeroMetricTone;
  /** Hierarquia visual: 2 primárias + 2 secundárias quando os quatro slots existem. */
  size: "primary" | "secondary";
}

/**
 * Hierarquia visual do Command Header (não nova semântica).
 * Primárias: filiações, cobranças · Secundárias: empresas, trabalhadores.
 * Só inclui slots com permission (métrica ≠ null).
 */
export function buildHeroMetrics(metrics: UnionDashboardMetrics): HeroMetric[] {
  const out: HeroMetric[] = [];

  if (metrics.membershipsActive !== null) {
    out.push({
      key: "memberships",
      label: "Filiações ativas",
      value: formatInteiro(metrics.membershipsActive),
      hint: "associados vigentes",
      href: "/filiacao",
      tone: "teal",
      size: "primary",
    });
  }

  if (metrics.chargesOpen !== null) {
    out.push({
      key: "charges",
      label: "Cobranças em aberto",
      value: formatInteiro(metrics.chargesOpen),
      hint: "pendentes ou vencidas",
      href: "/cobrancas",
      tone: metrics.chargesOpen > 0 ? "warning" : "default",
      size: "primary",
    });
  }

  if (metrics.companies !== null) {
    out.push({
      key: "companies",
      label: "Empresas",
      value: formatInteiro(metrics.companies),
      hint: "ativas",
      href: "/empresas",
      tone: "teal",
      size: "secondary",
    });
  }

  if (metrics.workers !== null) {
    out.push({
      key: "workers",
      label: "Trabalhadores",
      value: formatInteiro(metrics.workers),
      hint: "vínculos ativos",
      href: "/trabalhadores",
      size: "secondary",
    });
  }

  return out;
}

export interface OperationPulseItem {
  key: string;
  label: string;
  value: string;
  hint: string;
  href?: string;
  tone: "info" | "warning" | "success" | "danger";
}

/**
 * Reservado para pulso temporal real (atendimentos hoje, homologações, etc.).
 * Não usar com os quatro counts do header — redundância proibida (Fase 2.1).
 */
export function buildOperationPulse(_metrics: UnionDashboardMetrics): OperationPulseItem[] {
  return [];
}
