import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { formatMoeda } from "@/lib/formatters/moeda";

type Client = SupabaseClient<Database>;

export interface PlatformMetrics {
  tenantRealCount: number;
  tenantDbCount: number;
  chargePendingCount: number;
  chargePaidCount: number;
  chargeCancelledCount: number;
  chargeOverdueCount: number;
  amountPending: number;
  amountPaid: number;
  byProvider: Record<string, number>;
  topTenantsByPending: { tenantId: string; label: string; count: number; amount: number }[];
  monthly: { month: string; created: number; paid: number }[];
  unreadNotifications: number;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function fetchPlatformMetrics(supabase: Client): Promise<PlatformMetrics> {
  const { count: tenantDbCount } = await supabase
    .from("tenant")
    .select("id", { count: "exact", head: true });

  const { data: tenants } = await supabase
    .from("tenant")
    .select("id, slug, legal_name, trade_name, default_charge_provider")
    .limit(500);

  const realTenants = (tenants ?? []).filter(
    (t) => t.slug && !t.slug.startsWith("tenant-de-teste") && !/-1\d{12,}-/.test(t.slug),
  );
  const tenantLabel = Object.fromEntries(
    realTenants.map((t) => [t.id, t.trade_name ?? t.legal_name]),
  );

  const byProvider = realTenants.reduce(
    (acc, t) => {
      const p = t.default_charge_provider || "stub";
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const { data: charges } = await supabase
    .from("charge")
    .select("id, tenant_id, amount, status, due_date, created_at, paid_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  const today = new Date().toISOString().slice(0, 10);
  let chargePendingCount = 0;
  let chargePaidCount = 0;
  let chargeCancelledCount = 0;
  let chargeOverdueCount = 0;
  let amountPending = 0;
  let amountPaid = 0;

  const pendingByTenant = new Map<string, { count: number; amount: number }>();
  const monthlyMap = new Map<string, { created: number; paid: number }>();

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    monthlyMap.set(monthKey(d), { created: 0, paid: 0 });
  }

  for (const c of charges ?? []) {
    if (c.status === "pendente") {
      chargePendingCount += 1;
      amountPending += Number(c.amount);
      const cur = pendingByTenant.get(c.tenant_id) ?? { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += Number(c.amount);
      pendingByTenant.set(c.tenant_id, cur);
      if (c.due_date < today) chargeOverdueCount += 1;
    } else if (c.status === "pago") {
      chargePaidCount += 1;
      amountPaid += Number(c.amount);
    } else if (c.status === "cancelado") {
      chargeCancelledCount += 1;
    } else if (c.status === "vencido") {
      chargeOverdueCount += 1;
      chargePendingCount += 1;
      amountPending += Number(c.amount);
    }

    const createdMonth = monthKey(new Date(c.created_at));
    if (monthlyMap.has(createdMonth)) {
      monthlyMap.get(createdMonth)!.created += 1;
    }
    if (c.paid_at) {
      const paidMonth = monthKey(new Date(c.paid_at));
      if (monthlyMap.has(paidMonth)) {
        monthlyMap.get(paidMonth)!.paid += 1;
      }
    }
  }

  const topTenantsByPending = [...pendingByTenant.entries()]
    .map(([tenantId, v]) => ({
      tenantId,
      label: tenantLabel[tenantId] ?? tenantId.slice(0, 8),
      count: v.count,
      amount: v.amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const { count: unreadNotifications } = await supabase
    .from("platform_notification")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return {
    tenantRealCount: realTenants.length,
    tenantDbCount: tenantDbCount ?? 0,
    chargePendingCount,
    chargePaidCount,
    chargeCancelledCount,
    chargeOverdueCount,
    amountPending,
    amountPaid,
    byProvider,
    topTenantsByPending,
    monthly: [...monthlyMap.entries()].map(([month, v]) => ({ month, ...v })),
    unreadNotifications: unreadNotifications ?? 0,
  };
}

export function formatMetricMoney(n: number): string {
  return formatMoeda(n);
}
