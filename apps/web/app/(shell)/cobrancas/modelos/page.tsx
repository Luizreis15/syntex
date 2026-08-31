import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { SyntexMetric, SyntexMetricBar } from "@/components/ui/syntex-metric";
import { SyntexPanel, SyntexPanelBody } from "@/components/ui/syntex-panel";
import { fetchRevenuePlans } from "@/features/revenue-plans/data";
import {
  AUDIENCE_LABEL,
  CALCULATION_METHOD_LABEL,
  COLLECTION_ROLE_LABEL,
  REVENUE_PLAN_TYPE_LABEL,
  SOURCE_TYPE_LABEL,
} from "@/lib/domain/revenue-plan";
import { formatMoeda } from "@/lib/formatters/moeda";

export default async function ModelosCobrancaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasAnyGrant(session.grants, "contribution_rule.read")) {
    return <div><SyntexPageHeader breadcrumbs={[{ label: "Financeiro" }, { label: "Planos de arrecadação" }]} title="Planos de arrecadação" /><div className="p-6"><SyntexEmptyState title="Sem permissão" description="contribution_rule.read é necessária." /></div></div>;
  }

  const plans = await fetchRevenuePlans(session.supabase, session.tenantId);
  const canWrite = hasAnyGrant(session.grants, "contribution_rule.write");
  const active = plans.filter((plan) => plan.status === "active").length;
  const drafts = plans.filter((plan) => plan.status === "draft").length;
  const cctBased = plans.filter((plan) => plan.source_type === "collective_agreement").length;

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Financeiro" }, { label: "Planos de arrecadação" }]}
        title="Planos de arrecadação"
        metadata={<span className="text-body text-ink-2">A regra vem antes da cobrança: fundamento, público, cálculo e vencimento.</span>}
        actions={canWrite ? <Link href="/cobrancas/modelos/novo" className="inline-flex h-input items-center rounded-control bg-petrol-800 px-4 text-body font-semibold text-white hover:bg-petrol-700">+ Novo plano</Link> : null}
      />

      <div className="space-y-5 p-6">
        <SyntexPanel variant="raised" rail="teal">
          <SyntexPanelBody className="py-4">
            <SyntexMetricBar>
              <SyntexMetric label="Planos cadastrados" value={String(plans.length)} tone="teal" size="secondary" />
              <SyntexMetric label="Ativos" value={String(active)} tone="success" size="secondary" />
              <SyntexMetric label="Rascunhos" value={String(drafts)} tone="warning" size="secondary" />
              <SyntexMetric label="Fundamentados em CCT/ACT" value={String(cctBased)} tone="default" size="secondary" />
            </SyntexMetricBar>
          </SyntexPanelBody>
        </SyntexPanel>

        {plans.length === 0 ? (
          <SyntexEmptyState title="Nenhum plano de arrecadação" description="Cadastre a primeira regra antes de calcular ou emitir cobranças." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {plans.map((plan) => (
              <SyntexPanel key={plan.id} variant={plan.status === "active" ? "raised" : "standard"} rail={plan.status === "active" ? "teal" : "amber"}>
                <SyntexPanelBody className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-component font-semibold text-ink">{plan.name}</h2>
                        <span className={`rounded-full px-2 py-0.5 text-label font-semibold ${plan.status === "active" ? "bg-emerald-50 text-emerald-700" : plan.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{plan.status === "active" ? "ATIVO" : plan.status === "draft" ? "RASCUNHO" : "INATIVO"}</span>
                      </div>
                      <p className="mt-1 text-body text-ink-2">{REVENUE_PLAN_TYPE_LABEL[plan.type]}</p>
                    </div>
                    <p className="font-mono text-body font-semibold text-petrol-700">{plan.value_type === "percentual" ? `${Number(plan.value)}%` : formatMoeda(Number(plan.value))}</p>
                  </div>

                  <div className="rounded-control bg-surface-inset p-3">
                    <p className="text-label uppercase tracking-wide text-ink-3">Método</p>
                    <p className="mt-1 text-body font-medium text-ink">{CALCULATION_METHOD_LABEL[plan.calculation_method]}</p>
                  </div>

                  <dl className="grid gap-x-4 gap-y-3 text-body sm:grid-cols-2">
                    <Meta label="Fundamento" value={`${SOURCE_TYPE_LABEL[plan.source_type]}${plan.agreement?.mediador_number ? ` · ${plan.agreement.mediador_number}` : ""}`} />
                    <Meta label="Público" value={AUDIENCE_LABEL[plan.audience]} />
                    <Meta label="Recolhimento" value={COLLECTION_ROLE_LABEL[plan.collection_role]} />
                    <Meta label="Vigência" value={`${plan.valid_from} → ${plan.valid_until ?? "aberta"}`} mono />
                  </dl>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-label text-ink-3">Vencimento: dia {plan.due_day} do mês seguinte</span>
                    {plan.status === "active" ? <Link href={`/cobrancas/resolver?planId=${plan.id}`} className="text-body font-semibold text-petrol-700 hover:underline">Apurar competência →</Link> : null}
                  </div>
                </SyntexPanelBody>
              </SyntexPanel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-label uppercase tracking-wide text-ink-3">{label}</dt><dd className={`mt-0.5 text-ink-2 ${mono ? "font-mono text-label" : ""}`}>{value}</dd></div>;
}
