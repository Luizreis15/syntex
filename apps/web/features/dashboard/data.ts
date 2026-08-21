import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { UserGrant } from "@syntex/permissions";
import { hasAnyGrant } from "@syntex/permissions";

type Client = SupabaseClient<Database>;

export interface UnionDashboardMetrics {
  companyCount: number;
  workerCount: number;
  chargeOpenCount: number;
  membershipActiveCount: number;
}

/**
 * Métricas enxutas do painel do sindicato (Cadastro / dia a dia).
 * Contagens simples — não é BI.
 */
export async function fetchUnionDashboard(
  supabase: Client,
  tenantId: string,
  grants: UserGrant[],
): Promise<UnionDashboardMetrics> {
  const empty: UnionDashboardMetrics = {
    companyCount: 0,
    workerCount: 0,
    chargeOpenCount: 0,
    membershipActiveCount: 0,
  };

  if (hasAnyGrant(grants, "company.read")) {
    const { count } = await supabase
      .from("company")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "ativa");
    empty.companyCount = count ?? 0;
  }

  if (hasAnyGrant(grants, "worker.read")) {
    const { count } = await supabase
      .from("employment_relationship")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "ativo")
      .is("valid_until", null);
    empty.workerCount = count ?? 0;
  }

  if (hasAnyGrant(grants, "finance.read")) {
    const { count } = await supabase
      .from("charge")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["pendente", "vencido"]);
    empty.chargeOpenCount = count ?? 0;
  }

  if (hasAnyGrant(grants, "membership.read")) {
    const { count } = await supabase
      .from("membership")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "ativo")
      .is("valid_until", null);
    empty.membershipActiveCount = count ?? 0;
  }

  return empty;
}
