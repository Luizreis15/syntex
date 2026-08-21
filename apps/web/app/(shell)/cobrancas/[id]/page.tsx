import { notFound, redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchChargeDetail } from "@/features/charges/data";
import { SettleChargeButton } from "@/features/charges/settle-charge-button";
import { GatewayChargeActions } from "@/features/charges/gateway-charge-actions";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatCompetencia } from "@/lib/formatters/competencia";

export default async function CobrancaDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "finance.read")) {
    return (
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Financeiro" }, { label: "Cobrança" }]} title="Cobrança" />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="finance.read é necessária." />
        </div>
      </div>
    );
  }

  let detail;
  try {
    detail = await fetchChargeDetail(session.supabase, session.tenantId, params.id);
  } catch {
    notFound();
  }

  const { charge, journal } = detail;
  const obligation = charge.obligation as unknown as {
    competence: string;
    status: string;
    rule_snapshot: unknown;
    company: { legal_name: string; trade_name: string | null; cnpj: string } | null;
    contribution_rule: {
      type: string;
      value_type: string;
      value: number;
      calculation_base: string;
    } | null;
  };

  const canWrite = hasAnyGrant(session.grants, "finance.write");
  const canSettle = canWrite && (charge.status === "pendente" || charge.status === "vencido");

  const lines = (journal?.journal_line ?? []) as {
    id: string;
    account: string;
    debit: number;
    credit: number;
  }[];

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[
          { label: "Financeiro" },
          { label: "Cobrança", href: "/cobrancas" },
          { label: formatMoeda(Number(charge.amount)) },
        ]}
        title={obligation.company?.trade_name ?? obligation.company?.legal_name ?? "Cobrança"}
        metadata={
          <span className="font-mono text-body text-ink-2">
            {obligation.company?.cnpj} · {formatCompetencia(obligation.competence)} · {charge.status}
            {charge.provider ? ` · ${charge.provider}` : ""}
          </span>
        }
        actions={canSettle ? <SettleChargeButton chargeId={charge.id} /> : null}
      />

      <div className="space-y-6 p-6">
        <section className="space-y-2 border-b border-border pb-4">
          <h2 className="text-component font-semibold text-ink">Cobrança</h2>
          <dl className="grid gap-2 text-body sm:grid-cols-2">
            <div>
              <dt className="text-label text-ink-3">Valor</dt>
              <dd className="font-mono">{formatMoeda(Number(charge.amount))}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-3">Vencimento</dt>
              <dd className="font-mono">{charge.due_date}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-3">Pago em</dt>
              <dd className="font-mono">{charge.paid_at ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-3">Método</dt>
              <dd>{charge.payment_method ?? "—"}</dd>
            </div>
          </dl>
        </section>

        {(charge.provider_charge_id || canWrite) && (
          <section className="space-y-3 border-b border-border pb-4">
            {charge.provider_charge_id && (
              <div className="space-y-2 text-body">
                <h2 className="text-component font-semibold text-ink">Intent de pagamento</h2>
                <p className="font-mono text-ink-2">
                  {charge.provider} · {charge.provider_charge_id} · {charge.billing_type ?? "—"}
                </p>
                {charge.pix_copy_paste && (
                  <p className="break-all rounded-sm border border-border bg-surface-2 p-2 font-mono text-label">
                    {charge.pix_copy_paste}
                  </p>
                )}
                {charge.boleto_url && (
                  <p>
                    <a href={charge.boleto_url} className="text-petrol-700 hover:underline">
                      {charge.boleto_url}
                    </a>
                  </p>
                )}
                {charge.barcode && <p className="font-mono text-ink-2">{charge.barcode}</p>}
                {charge.nosso_numero && (
                  <p className="font-mono text-ink-2">nosso número · {charge.nosso_numero}</p>
                )}
                {charge.payment_link && (
                  <p>
                    <a
                      href={charge.payment_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-petrol-700 hover:underline"
                    >
                      Abrir link de pagamento
                    </a>
                  </p>
                )}
              </div>
            )}
            {canWrite && (
              <GatewayChargeActions
                chargeId={charge.id}
                hasIntent={Boolean(charge.provider_charge_id)}
                status={charge.status}
              />
            )}
          </section>
        )}

        <section className="space-y-2 border-b border-border pb-4">
          <h2 className="text-component font-semibold text-ink">Obrigação e snapshot da regra</h2>
          <p className="text-body text-ink-2">
            Status da obrigação: <span className="font-medium text-ink">{obligation.status}</span>
            {obligation.contribution_rule && (
              <>
                {" · "}
                {obligation.contribution_rule.type} · {obligation.contribution_rule.calculation_base} ·{" "}
                <span className="font-mono">
                  {obligation.contribution_rule.value_type === "percentual"
                    ? `${obligation.contribution_rule.value}%`
                    : obligation.contribution_rule.value}
                </span>
              </>
            )}
          </p>
          <pre className="overflow-x-auto rounded-sm border border-border bg-surface-2 p-3 font-mono text-label text-ink-2">
            {JSON.stringify(obligation.rule_snapshot, null, 2)}
          </pre>
        </section>

        <section className="space-y-2">
          <h2 className="text-component font-semibold text-ink">Lançamento contábil</h2>
          {!journal ? (
            <p className="text-body text-ink-2">Sem lançamento — aparece após a baixa.</p>
          ) : (
            <table className="w-full border-collapse text-left text-body" aria-label="Partidas">
              <thead>
                <tr className="border-b border-border text-label uppercase text-ink-3">
                  <th className="py-2 pr-3 font-medium">Conta</th>
                  <th className="py-2 pr-3 font-medium">Débito</th>
                  <th className="py-2 font-medium">Crédito</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b border-border">
                    <td className="py-2 pr-3 font-mono">{line.account}</td>
                    <td className="py-2 pr-3 font-mono">
                      {Number(line.debit) > 0 ? formatMoeda(Number(line.debit)) : "—"}
                    </td>
                    <td className="py-2 font-mono">
                      {Number(line.credit) > 0 ? formatMoeda(Number(line.credit)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
