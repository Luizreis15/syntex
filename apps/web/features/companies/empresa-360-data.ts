import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatInteiro } from "@/features/dashboard/format";
import { fetchChargesPage } from "@/features/charges/data";
import {
  DEMO_EMPRESA_CONTATO,
  DEMO_EMPRESA_HOMOLOGACOES,
  demoWorkerBreakdown,
} from "@/features/companies/demo-empresa-360";

type Client = SupabaseClient<Database>;

export interface Empresa360Stats {
  workersActive: number;
  membersActive: number | null;
  openChargeCount: number;
  openChargeAmount: number;
  overdueChargeCount: number;
  overdueChargeAmount: number;
  openCharges: {
    id: string;
    amount: number;
    status: string;
    dueDate: string;
  }[];
}

export async function fetchEmpresa360Stats(
  supabase: Client,
  tenantId: string,
  companyId: string,
): Promise<Empresa360Stats> {
  const [{ count: workersActive }, chargesPage] = await Promise.all([
    supabase
      .from("employment_relationship")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .eq("status", "ativo")
      .is("valid_until", null),
    fetchChargesPage(supabase, tenantId, undefined, companyId).catch(() => []),
  ]);

  const open = chargesPage.filter((r) => r.status === "pendente" || r.status === "vencido");
  let openChargeAmount = 0;
  let overdueChargeAmount = 0;
  let overdueChargeCount = 0;
  const openCharges = open.map((row) => {
    const amount = Number(row.amount);
    openChargeAmount += amount;
    if (row.status === "vencido") {
      overdueChargeCount += 1;
      overdueChargeAmount += amount;
    }
    return {
      id: row.id,
      amount,
      status: row.status,
      dueDate: row.due_date,
    };
  });

  let membersActive: number | null = null;
  const { data: employments } = await supabase
    .from("employment_relationship")
    .select("worker_id")
    .eq("tenant_id", tenantId)
    .eq("company_id", companyId)
    .eq("status", "ativo")
    .is("valid_until", null)
    .limit(500);

  const workerIds = [...new Set((employments ?? []).map((e) => e.worker_id))];
  if (workerIds.length > 0) {
    const { data: workers } = await supabase
      .from("worker")
      .select("id, person_id")
      .eq("tenant_id", tenantId)
      .in("id", workerIds);
    const personIds = [...new Set((workers ?? []).map((w) => w.person_id).filter(Boolean))];
    if (personIds.length > 0) {
      const { count } = await supabase
        .from("membership")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "ativo")
        .is("valid_until", null)
        .in("person_id", personIds);
      membersActive = count ?? 0;
    }
  }

  return {
    workersActive: workersActive ?? 0,
    membersActive,
    openChargeCount: open.length,
    openChargeAmount,
    overdueChargeCount,
    overdueChargeAmount,
    openCharges,
  };
}

export type SummaryTone = "syntex" | "ok" | "critical" | "amber" | "teal";

export interface SummaryItem {
  label: string;
  value: string;
  hint: string;
  tone: SummaryTone;
}

export function buildEmpresaSummary(stats: Empresa360Stats): SummaryItem[] {
  const monthlyDemo =
    stats.workersActive > 0
      ? formatMoeda(Math.round(stats.workersActive * 58.5))
      : "R$ 18,4 mil";

  const pendencias =
    stats.openChargeCount > 0
      ? {
          value: formatMoeda(stats.openChargeAmount),
          hint: `${formatInteiro(stats.openChargeCount)} título${stats.openChargeCount === 1 ? "" : "s"}`,
          tone: "critical" as const,
        }
      : {
          value: "R$ 4,8 mil",
          hint: "3 títulos · demo",
          tone: "critical" as const,
        };

  return [
    {
      label: "Trabalhadores",
      value: formatInteiro(stats.workersActive),
      hint: "vínculos ativos",
      tone: "syntex",
    },
    {
      label: "Arrecadação mensal",
      value: monthlyDemo,
      hint: "média estimada · demo",
      tone: "ok",
    },
    {
      label: "Pendências",
      value: pendencias.value,
      hint: pendencias.hint,
      tone: pendencias.tone,
    },
    {
      label: "Homologações",
      value: DEMO_EMPRESA_HOMOLOGACOES.value,
      hint: `${DEMO_EMPRESA_HOMOLOGACOES.hint} · demo`,
      tone: "amber",
    },
    {
      label: "Último contato",
      value: DEMO_EMPRESA_CONTATO.value,
      hint: `${DEMO_EMPRESA_CONTATO.hint} · demo`,
      tone: "teal",
    },
  ];
}

export function buildWorkerMix(stats: Empresa360Stats) {
  if (stats.membersActive != null && stats.workersActive > 0) {
    const associados = Math.min(stats.membersActive, stats.workersActive);
    const resto = Math.max(0, stats.workersActive - associados);
    const incompleto = Math.min(resto, Math.max(1, Math.round(stats.workersActive * 0.05)));
    const nao = Math.max(0, resto - incompleto);
    const total = stats.workersActive;
    return {
      source: "mixed" as const,
      rows: [
        {
          label: "Associados",
          value: associados,
          pct: Math.round((associados / total) * 100),
          tone: "ok" as const,
        },
        {
          label: "Não associados",
          value: nao,
          pct: Math.round((nao / total) * 100),
          tone: "syntex" as const,
        },
        {
          label: "Cadastro incompleto",
          value: incompleto,
          pct: Math.round((incompleto / total) * 100),
          tone: "amber" as const,
          demo: true as const,
        },
      ],
    };
  }
  return { source: "demo" as const, rows: demoWorkerBreakdown(stats.workersActive) };
}
