import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexMetric, SyntexMetricBar } from "@/components/ui/syntex-metric";
import { fetchUnionDashboard } from "@/features/dashboard/data";

export default async function PainelPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "company.read")) {
    redirect("/empresas");
  }

  const metrics = await fetchUnionDashboard(session.supabase, session.tenantId, session.grants);
  const grants = session.grants;

  const canCompany = hasAnyGrant(grants, "company.read");
  const canWorker = hasAnyGrant(grants, "worker.read");
  const canFinance = hasAnyGrant(grants, "finance.read");
  const canMembership = hasAnyGrant(grants, "membership.read");

  const canCreateCompany =
    hasAnyGrant(grants, "company.master.provision") || hasAnyGrant(grants, "company.write");
  const canCreateWorker = hasAnyGrant(grants, "worker.write");

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Início" }, { label: "Painel" }]}
        title="Painel"
        metadata={
          <span className="text-body text-ink-2">
            Quadro do dia — Cadastro e cobranças do sindicato
          </span>
        }
      />
      <div className="space-y-8 p-6">
        {(canCompany || canWorker) && (
          <section className="space-y-2">
            <h2 className="text-label uppercase text-ink-3">Cadastro</h2>
            <SyntexMetricBar>
              {canCompany && (
                <SyntexMetric label="Empresas" value={String(metrics.companyCount)} href="/empresas" />
              )}
              {canWorker && (
                <SyntexMetric
                  label="Trabalhadores"
                  value={String(metrics.workerCount)}
                  hint="com vínculo ativo"
                  href="/trabalhadores"
                />
              )}
            </SyntexMetricBar>
          </section>
        )}

        {(canFinance || canMembership) && (
          <section className="space-y-2">
            <h2 className="text-label uppercase text-ink-3">Financeiro e atendimento</h2>
            <SyntexMetricBar>
              {canFinance && (
                <SyntexMetric
                  label="Cobranças em aberto"
                  value={String(metrics.chargeOpenCount)}
                  href="/cobrancas"
                  tone={metrics.chargeOpenCount > 0 ? "warning" : "default"}
                />
              )}
              {canMembership && (
                <SyntexMetric
                  label="Filiações ativas"
                  value={String(metrics.membershipActiveCount)}
                  href="/filiacao"
                />
              )}
            </SyntexMetricBar>
          </section>
        )}

        {(canCreateCompany || canCreateWorker || canFinance) && (
          <section className="space-y-2">
            <h2 className="text-label uppercase text-ink-3">Atalhos</h2>
            <ul className="flex flex-wrap gap-2">
              {canCreateCompany && (
                <li>
                  <Link
                    href="/empresas/nova"
                    className="inline-flex h-input items-center rounded-sm bg-petrol-800 px-3 text-body text-shell-ink hover:bg-petrol-700"
                  >
                    Nova empresa
                  </Link>
                </li>
              )}
              {canCreateWorker && (
                <li>
                  <Link
                    href="/trabalhadores/novo"
                    className="inline-flex h-input items-center rounded-sm border border-border bg-surface px-3 text-body text-ink hover:bg-surface-2"
                  >
                    Novo trabalhador
                  </Link>
                </li>
              )}
              {canFinance && (
                <li>
                  <Link
                    href="/cobrancas"
                    className="inline-flex h-input items-center rounded-sm border border-border bg-surface px-3 text-body text-ink hover:bg-surface-2"
                  >
                    Ver cobranças
                  </Link>
                </li>
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
