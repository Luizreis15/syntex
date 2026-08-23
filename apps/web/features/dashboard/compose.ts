import { formatInteiro } from "@/features/dashboard/format";
import type { UnionDashboardMetrics } from "@/features/dashboard/data";
import type { ChargeIntel } from "@/features/dashboard/charge-intel";
import {
  DEMO_ARRECADACAO_HERO,
  DEMO_ASSOCIADOS_DELTA,
  DEMO_EMPRESAS_DELTA,
} from "@/features/dashboard/demo-painel";

export type HeroMetricTone = "default" | "warning" | "danger" | "teal";

export interface HeroMetricProgress {
  /** 0–100, denominador real obrigatório. */
  value: number;
  tone: "teal" | "blue" | "green" | "amber" | "red";
  label: string;
}

export interface HeroMetric {
  key: string;
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: HeroMetricTone;
  /** Hierarquia visual: 2 primárias + 2 secundárias quando os quatro slots existem. */
  size: "primary" | "secondary";
  /** Proporção real opcional (ex.: filiados/vínculos, vencidas/abertas). */
  progress?: HeroMetricProgress;
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

/**
 * Anexa progressos com denominador real — nunca inventa %.
 * - Filiações / trabalhadores ativos → densidade de filiação
 * - Cobranças vencidas / abertas → pressão de atraso (quando intel disponível)
 */
export function attachHeroProgress(
  metrics: HeroMetric[],
  input: {
    membershipsActive: number | null;
    workersActive: number | null;
    overdueCount: number | null;
    openCount: number | null;
  },
): HeroMetric[] {
  return metrics.map((metric) => {
    if (
      metric.key === "memberships" &&
      input.membershipsActive != null &&
      input.workersActive != null &&
      input.workersActive > 0
    ) {
      const value = (input.membershipsActive / input.workersActive) * 100;
      return {
        ...metric,
        progress: {
          value,
          tone: "teal",
          label: "Filiações sobre vínculos ativos",
        },
      };
    }
    if (
      metric.key === "charges" &&
      input.overdueCount != null &&
      input.openCount != null &&
      input.openCount > 0
    ) {
      const value = (input.overdueCount / input.openCount) * 100;
      return {
        ...metric,
        progress: {
          value,
          tone: value >= 40 ? "red" : "amber",
          label: "Vencidas sobre cobranças em aberto",
        },
      };
    }
    return metric;
  });
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

/** Bloco Lovable do hero: associados reais + arrecadação DEMO + inadimplência (real ou DEMO). */
export interface LovableHeroBlock {
  associados: {
    value: string;
    delta: string;
    densityLabel: string;
    meter: number;
    href: string;
  } | null;
  /** DEMO UI — substituir por arrecadação real depois */
  arrecadacao: typeof DEMO_ARRECADACAO_HERO;
  inadimplencia: {
    value: string;
    delta: string;
    source: "real" | "demo";
  };
  empresas: {
    value: string;
    delta: string;
    href: string;
  } | null;
}

export function buildLovableHeroBlock(
  metrics: UnionDashboardMetrics,
  financeIntel: ChargeIntel | null,
): LovableHeroBlock {
  let associados: LovableHeroBlock["associados"] = null;
  if (metrics.membershipsActive !== null) {
    const meter =
      metrics.workers != null && metrics.workers > 0
        ? Math.round((metrics.membershipsActive / metrics.workers) * 1000) / 10
        : 92;
    const densityLabel =
      metrics.workers != null && metrics.workers > 0
        ? `${meter.toLocaleString("pt-BR")}% dos vínculos filiados`
        : "associados vigentes";
    associados = {
      value: formatInteiro(metrics.membershipsActive),
      delta: DEMO_ASSOCIADOS_DELTA,
      densityLabel,
      meter: Math.min(100, Math.max(2, meter)),
      href: "/filiacao",
    };
  }

  let inadimplencia: LovableHeroBlock["inadimplencia"];
  if (financeIntel && financeIntel.openCount > 0) {
    const pct = (financeIntel.overdueCount / financeIntel.openCount) * 100;
    inadimplencia = {
      value: `${pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
      delta: "sobre abertas",
      source: "real",
    };
  } else {
    inadimplencia = {
      value: "6,8%",
      delta: "+1,4 p.p.",
      source: "demo",
    };
  }

  let empresas: LovableHeroBlock["empresas"] = null;
  if (metrics.companies !== null) {
    empresas = {
      value: formatInteiro(metrics.companies),
      delta: DEMO_EMPRESAS_DELTA,
      href: "/empresas",
    };
  }

  return {
    associados,
    arrecadacao: DEMO_ARRECADACAO_HERO,
    inadimplencia,
    empresas,
  };
}
