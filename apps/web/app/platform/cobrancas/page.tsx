import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@syntex/database";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatCompetencia } from "@/lib/formatters/competencia";
import { formatCnpj } from "@/lib/formatters/cnpj";
import { CancelChargeButton } from "@/features/platform/cancel-charge-button";

export default async function PlatformCobrancasPage({
  searchParams,
}: {
  searchParams: { status?: string; tenant?: string };
}) {
  const session = await getPlatformSession();
  if (!session) redirect("/login");

  const admin = createSupabaseAdminClient();

  const { data: tenants } = await admin
    .from("tenant")
    .select("id, slug, legal_name, trade_name")
    .order("legal_name");

  const tenantById = Object.fromEntries((tenants ?? []).map((t) => [t.id, t]));

  let query = admin
    .from("charge")
    .select(
      `
      id, tenant_id, amount, due_date, status, provider, created_at, cancel_reason,
      obligation:obligation_id(
        competence,
        company:company_id(legal_name, trade_name, cnpj)
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(150);

  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.tenant) query = query.eq("tenant_id", searchParams.tenant);

  const { data: rows, error } = await query;
  if (error) throw error;

  const status = searchParams.status;
  const tenantFilter = searchParams.tenant;

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Plataforma", href: "/platform" }, { label: "Cobranças" }]}
        title="Cobranças"
        metadata={
          <span className="text-body text-ink-2">
            Cross-tenant · cancelamento operacional com motivo
          </span>
        }
        className="border-0 bg-transparent px-0 py-0"
      />

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2 text-body">
          <FilterLink href="/platform/cobrancas" active={!status && !tenantFilter}>
            Todas
          </FilterLink>
          <FilterLink href="/platform/cobrancas?status=pendente" active={status === "pendente"}>
            Pendentes
          </FilterLink>
          <FilterLink href="/platform/cobrancas?status=pago" active={status === "pago"}>
            Pagas
          </FilterLink>
          <FilterLink href="/platform/cobrancas?status=cancelado" active={status === "cancelado"}>
            Canceladas
          </FilterLink>
        </div>

        {(rows ?? []).length === 0 ? (
          <SyntexEmptyState
            title="Nenhuma cobrança"
            description="Quando os sindicatos gerarem guias, elas aparecem aqui."
          />
        ) : (
          <table className="w-full border-collapse text-left text-body" aria-label="Cobranças plataforma">
            <thead>
              <tr className="border-b border-border text-label uppercase text-ink-3">
                <th className="py-2 pr-3 font-medium">Sindicato</th>
                <th className="py-2 pr-3 font-medium">Empresa</th>
                <th className="py-2 pr-3 font-medium">Competência</th>
                <th className="py-2 pr-3 font-medium">Valor</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((row) => {
                const tenant = tenantById[row.tenant_id];
                const obligation = row.obligation as unknown as {
                  competence: string;
                  company: { legal_name: string; trade_name: string | null; cnpj: string } | null;
                } | null;
                return (
                  <tr key={row.id} className="border-b border-border align-top">
                    <td className="py-2.5 pr-3">
                      {tenant ? (
                        <Link
                          href={`/platform/tenants/${tenant.id}`}
                          className="text-petrol-700 hover:underline"
                        >
                          {tenant.trade_name ?? tenant.legal_name}
                        </Link>
                      ) : (
                        <span className="font-mono text-label">{row.tenant_id.slice(0, 8)}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span>
                        {obligation?.company?.trade_name ?? obligation?.company?.legal_name ?? "—"}
                      </span>
                      {obligation?.company?.cnpj && (
                        <span className="mt-0.5 block font-mono text-label text-ink-3">
                          {formatCnpj(obligation.company.cnpj)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 font-mono">
                      {obligation ? formatCompetencia(obligation.competence) : "—"}
                    </td>
                    <td className="py-2.5 pr-3 font-mono">{formatMoeda(Number(row.amount))}</td>
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{row.status}</span>
                      {row.cancel_reason && (
                        <span className="mt-0.5 block text-label text-ink-3">{row.cancel_reason}</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <CancelChargeButton
                        tenantId={row.tenant_id}
                        chargeId={row.id}
                        status={row.status}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "border-b-2 border-petrol-700 font-medium text-ink"
          : "text-ink-2 hover:text-ink"
      }
    >
      {children}
    </Link>
  );
}
