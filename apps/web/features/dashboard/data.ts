import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { PermissionKey, UserGrant } from "@syntex/permissions";
import { hasAnyGrant } from "@syntex/permissions";

type Client = SupabaseClient<Database>;

/** Permissions that unlock at least one real dashboard metric. */
export const DASHBOARD_METRIC_PERMISSIONS = [
  "company.read",
  "worker.read",
  "finance.read",
  "membership.read",
] as const satisfies readonly PermissionKey[];

export type DashboardMetricKey = "companies" | "workers" | "chargesOpen" | "membershipsActive";

/**
 * `null` = sem permission (não consultar, não renderizar como zero).
 * `number` = contagem real (pode ser 0).
 */
export type DashboardMetricSlot = number | null;

export interface UnionDashboardMetrics {
  companies: DashboardMetricSlot;
  workers: DashboardMetricSlot;
  chargesOpen: DashboardMetricSlot;
  membershipsActive: DashboardMetricSlot;
  fetchedAt: string;
}

export function canAccessUnionDashboard(grants: UserGrant[]): boolean {
  return DASHBOARD_METRIC_PERMISSIONS.some((permission) => hasAnyGrant(grants, permission));
}

function emptySlots(): Omit<UnionDashboardMetrics, "fetchedAt"> {
  return {
    companies: null,
    workers: null,
    chargesOpen: null,
    membershipsActive: null,
  };
}

async function countExact(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Métricas do Command Center do sindicato.
 * Contagens head-only — não baixa rows. Sem permission ⇒ slot `null` (≠ 0).
 * Consultas independentes rodam em paralelo.
 *
 * Arrecadação em R$ / série previsto×realizado: schema distingue obrigação
 * (previsto) e charge pago (realizado), mas não há agregação segura sem
 * baixar rows ou RPC — fica fora desta fase (ver empty state na UI).
 */
export async function fetchUnionDashboard(
  supabase: Client,
  tenantId: string,
  grants: UserGrant[],
): Promise<UnionDashboardMetrics> {
  const slots = emptySlots();
  const tasks: Promise<void>[] = [];

  if (hasAnyGrant(grants, "company.read")) {
    tasks.push(
      countExact(
        supabase
          .from("company")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "ativa"),
      ).then((n) => {
        slots.companies = n;
      }),
    );
  }

  if (hasAnyGrant(grants, "worker.read")) {
    tasks.push(
      countExact(
        supabase
          .from("employment_relationship")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "ativo")
          .is("valid_until", null),
      ).then((n) => {
        slots.workers = n;
      }),
    );
  }

  if (hasAnyGrant(grants, "finance.read")) {
    tasks.push(
      countExact(
        supabase
          .from("charge")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .in("status", ["pendente", "vencido"]),
      ).then((n) => {
        slots.chargesOpen = n;
      }),
    );
  }

  if (hasAnyGrant(grants, "membership.read")) {
    tasks.push(
      countExact(
        supabase
          .from("membership")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "ativo")
          .is("valid_until", null),
      ).then((n) => {
        slots.membershipsActive = n;
      }),
    );
  }

  await Promise.all(tasks);

  return { ...slots, fetchedAt: new Date().toISOString() };
}
