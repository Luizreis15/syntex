import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { fetchUnionDashboard } from "@/features/dashboard/data";

export default async function PainelPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "company.read")) {
    redirect("/empresas");
  }

  const metrics = await fetchUnionDashboard(session.supabase, session.tenantId, session.grants);

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
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Empresas" value={String(metrics.companyCount)} href="/empresas" />
          <Stat
            label="Trabalhadores"
            value={String(metrics.workerCount)}
            hint="com vínculo ativo"
            href="/trabalhadores"
          />
          <Stat
            label="Cobranças em aberto"
            value={String(metrics.chargeOpenCount)}
            href="/cobrancas"
          />
          <Stat
            label="Filiações ativas"
            value={String(metrics.membershipActiveCount)}
            href="/filiacao"
          />
        </dl>

        <section>
          <h2 className="text-component font-semibold text-ink">Atalhos</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {hasAnyGrant(session.grants, "company.master.provision") ||
            hasAnyGrant(session.grants, "company.write") ? (
              <li>
                <Link
                  href="/empresas/nova"
                  className="inline-flex h-input items-center rounded-sm bg-petrol-800 px-3 text-body text-shell-ink"
                >
                  Nova empresa
                </Link>
              </li>
            ) : null}
            {hasAnyGrant(session.grants, "worker.write") ? (
              <li>
                <Link
                  href="/trabalhadores/novo"
                  className="inline-flex h-input items-center rounded-sm border border-border bg-surface px-3 text-body text-ink hover:bg-surface-2"
                >
                  Novo trabalhador
                </Link>
              </li>
            ) : null}
            {hasAnyGrant(session.grants, "finance.read") ? (
              <li>
                <Link
                  href="/cobrancas"
                  className="inline-flex h-input items-center rounded-sm border border-border bg-surface px-3 text-body text-ink hover:bg-surface-2"
                >
                  Ver cobranças
                </Link>
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface p-4">
      <dt className="text-label uppercase text-ink-3">{label}</dt>
      <dd className="mt-1 font-mono text-page-title font-semibold text-ink">
        <Link href={href} className="hover:text-petrol-700">
          {value}
        </Link>
      </dd>
      {hint ? <p className="mt-1 text-label text-ink-3">{hint}</p> : null}
    </div>
  );
}
