import { notFound, redirect } from "next/navigation";
import { hasAnyGrant, primaryCompanyId } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchChargeDetail } from "@/features/charges/data";
import { PortalPayActions } from "@/features/portal/portal-pay-actions";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatCompetencia } from "@/lib/formatters/competencia";

export default async function EmpresaCobrancaDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasAnyGrant(session.grants, "finance.read")) {
    return <SyntexEmptyState title="Sem permissão" description="finance.read é necessária." />;
  }

  const companyId = primaryCompanyId(session.grants);
  let detail;
  try {
    detail = await fetchChargeDetail(session.supabase, session.tenantId, params.id);
  } catch {
    notFound();
  }

  const obligation = detail.charge.obligation as unknown as {
    competence: string;
    company_id: string;
    company: { legal_name: string; trade_name: string | null } | null;
  };

  if (companyId && obligation.company_id !== companyId) {
    notFound();
  }

  const charge = detail.charge;
  const canPay = hasAnyGrant(session.grants, "finance.pay");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-title font-semibold text-ink">{formatMoeda(Number(charge.amount))}</h2>
        <p className="font-mono text-body text-ink-2">
          {formatCompetencia(obligation.competence)} · venc. {charge.due_date} · {charge.status}
        </p>
      </div>

      <dl className="grid gap-2 text-body sm:grid-cols-2">
        <div>
          <dt className="text-label text-ink-3">Método</dt>
          <dd>{charge.payment_method ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-label text-ink-3">Pago em</dt>
          <dd className="font-mono">{charge.paid_at ?? "—"}</dd>
        </div>
      </dl>

      {charge.provider_charge_id && (
        <section className="space-y-2 text-body">
          <h3 className="text-component font-semibold text-ink">Dados de pagamento</h3>
          <p className="font-mono text-ink-2">
            {charge.provider} · {charge.billing_type ?? "—"}
            {charge.nosso_numero ? ` · nosso nº ${charge.nosso_numero}` : ""}
          </p>
          {charge.pix_copy_paste && (
            <p className="break-all rounded-sm border border-border bg-surface-2 p-2 font-mono text-label">
              {charge.pix_copy_paste}
            </p>
          )}
          {charge.boleto_url && (
            <p>
              <a href={charge.boleto_url} className="text-petrol-700 hover:underline">
                Abrir boleto / linha digitável
              </a>
            </p>
          )}
          {charge.barcode && <p className="font-mono text-ink-2">{charge.barcode}</p>}
          {charge.payment_link && (
            <p>
              <a href={charge.payment_link} className="text-petrol-700 hover:underline">
                Link de pagamento
              </a>
            </p>
          )}
        </section>
      )}

      {canPay && (
        <PortalPayActions
          chargeId={charge.id}
          hasIntent={Boolean(charge.provider_charge_id)}
          status={charge.status}
        />
      )}
    </div>
  );
}
