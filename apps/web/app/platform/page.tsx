import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { createSupabaseAdminClient } from "@syntex/database";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { fetchPlatformMetrics, formatMetricMoney } from "@/lib/domain/platform-metrics";
import { PlatformEnvMissing } from "@/features/platform/platform-env-missing";

export default async function PlatformHomePage() {
  const session = await getPlatformSession();
  if (!session) redirect("/login");

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return (
      <PlatformEnvMissing
        message={err instanceof Error ? err.message : "SERVICE_ROLE ausente no runtime."}
      />
    );
  }
  const metrics = await fetchPlatformMetrics(admin);

  const { data: tenants } = await admin
    .from("tenant")
    .select("id, slug, legal_name, trade_name, default_charge_provider")
    .order("created_at", { ascending: false })
    .limit(200);

  const realTenants = (tenants ?? []).filter(
    (t) => t.slug && !t.slug.startsWith("tenant-de-teste") && !/-1\d{12,}-/.test(t.slug),
  );

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Plataforma" }]}
        title="Visão geral"
        metadata={<span className="text-body text-ink-2">Métricas operacionais multi-tenant</span>}
        className="border-0 bg-transparent px-0 py-0"
      />

      <div className="mt-6 space-y-8">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Sindicatos" value={String(metrics.tenantRealCount)} hint={`${metrics.tenantDbCount} no banco`} />
          <Stat
            label="Em aberto"
            value={String(metrics.chargePendingCount)}
            hint={formatMetricMoney(metrics.amountPending)}
          />
          <Stat
            label="Pagas"
            value={String(metrics.chargePaidCount)}
            hint={formatMetricMoney(metrics.amountPaid)}
          />
          <Stat
            label="Vencidas / atraso"
            value={String(metrics.chargeOverdueCount)}
            hint={`${metrics.chargeCancelledCount} canceladas · ${metrics.unreadNotifications} alertas não lidos`}
          />
        </dl>

        <section className="space-y-2">
          <h2 className="text-component font-semibold text-ink">Últimos 6 meses</h2>
          <table className="w-full max-w-lg border-collapse text-left text-body" aria-label="Série mensal">
            <thead>
              <tr className="border-b border-border text-label uppercase text-ink-3">
                <th className="py-2 pr-3 font-medium">Mês</th>
                <th className="py-2 pr-3 font-medium">Criadas</th>
                <th className="py-2 font-medium">Pagas</th>
              </tr>
            </thead>
            <tbody>
              {metrics.monthly.map((m) => (
                <tr key={m.month} className="border-b border-border">
                  <td className="py-2 pr-3 font-mono">{m.month}</td>
                  <td className="py-2 pr-3 font-mono">{m.created}</td>
                  <td className="py-2 font-mono">{m.paid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-2">
          <h2 className="text-component font-semibold text-ink">Maiores pendências por sindicato</h2>
          {metrics.topTenantsByPending.length === 0 ? (
            <p className="text-body text-ink-2">Sem cobranças pendentes.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {metrics.topTenantsByPending.map((t) => (
                <li key={t.tenantId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <Link
                    href={`/platform/tenants/${t.tenantId}`}
                    className="font-medium text-petrol-700 hover:underline"
                  >
                    {t.label}
                  </Link>
                  <span className="font-mono text-label text-ink-2">
                    {t.count} · {formatMetricMoney(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-component font-semibold text-ink">Gateway por sindicato</h2>
          <ul className="flex flex-wrap gap-3 text-body">
            {Object.entries(metrics.byProvider).map(([provider, n]) => (
              <li key={provider} className="rounded-sm border border-border px-3 py-1 font-mono text-label">
                {provider}: {n}
              </li>
            ))}
            {Object.keys(metrics.byProvider).length === 0 && (
              <li className="text-ink-2">Nenhum sindicato ainda.</li>
            )}
          </ul>
        </section>

        <section className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-component font-semibold text-ink">Recentes</h2>
            <Link href="/platform/tenants" className="text-body text-petrol-700 hover:underline">
              Ver todos
            </Link>
          </div>
          {realTenants.length === 0 ? (
            <p className="text-body text-ink-2">
              <Link href="/platform/tenants" className="text-petrol-700 hover:underline">
                Cadastrar o primeiro sindicato
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {realTenants.slice(0, 8).map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <Link href={`/platform/tenants/${t.id}`} className="font-medium text-petrol-700 hover:underline">
                    {t.trade_name ?? t.legal_name}
                  </Link>
                  <span className="font-mono text-label text-ink-2">{t.default_charge_provider}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-b border-border pb-3">
      <dt className="text-label uppercase text-ink-3">{label}</dt>
      <dd className="font-mono text-title text-ink">{value}</dd>
      {hint && <p className="text-label text-ink-3">{hint}</p>}
    </div>
  );
}
