import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchAgreementDetail } from "@/features/agreements/data";
import { AddContributionRuleForm } from "@/features/agreements/add-contribution-rule-form";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ConvencaoDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "agreement.read")) {
    return (
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Relações" }, { label: "Convenções" }]} title="Convenção" />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="agreement.read é necessária." />
        </div>
      </div>
    );
  }

  const date = searchParams.date ?? todayIso();
  let detail;
  try {
    detail = await fetchAgreementDetail(session.supabase, session.tenantId, params.id, date);
  } catch {
    notFound();
  }

  const { agreement, territories, rules } = detail;
  const economic = agreement.economic_category as unknown as { name: string } | null;
  const professional = agreement.professional_category as unknown as { name: string } | null;
  const canWriteRule = hasAnyGrant(session.grants, "contribution_rule.write");

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[
          { label: "Relações" },
          { label: "Convenções", href: "/convencoes" },
          { label: agreement.mediador_number ?? agreement.kind.toUpperCase() },
        ]}
        title={`${agreement.kind.toUpperCase()}${agreement.mediador_number ? ` · ${agreement.mediador_number}` : ""}`}
        metadata={
          <span className="font-mono text-body text-ink-2">
            {agreement.valid_from} → {agreement.valid_until} · data-base {agreement.base_date}
          </span>
        }
      />

      <div className="space-y-6 p-6">
        <section className="space-y-2 border-b border-border pb-4">
          <h2 className="text-component font-semibold text-ink">Categorias</h2>
          <p className="text-body text-ink-2">
            Econômica: {economic?.name ?? "—"} · Profissional: {professional?.name ?? "—"}
          </p>
        </section>

        <section className="space-y-2 border-b border-border pb-4">
          <h2 className="text-component font-semibold text-ink">Território</h2>
          {territories.length === 0 ? (
            <p className="text-body text-ink-2">Sem restrição municipal — vale em qualquer município.</p>
          ) : (
            <ul className="list-inside list-disc text-body text-ink-2">
              {territories.map((t) => {
                const mun = t.municipality as unknown as { name: string; state_code: string } | null;
                return (
                  <li key={t.municipality_id}>
                    {mun ? `${mun.name}/${mun.state_code}` : t.municipality_id}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-component font-semibold text-ink">Regras de contribuição na data</h2>
            <form className="flex items-end gap-2">
              <div className="space-y-1">
                <label htmlFor="date" className="text-label text-ink-3">
                  Data de referência
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={date}
                  className="h-input rounded-sm border border-border bg-surface px-2 text-body text-ink"
                />
              </div>
              <button type="submit" className="h-input rounded-sm border border-border-strong px-3 text-body">
                Consultar
              </button>
            </form>
          </div>

          {rules.length === 0 ? (
            <p className="text-body text-ink-2">Nenhuma regra vigente em {date}.</p>
          ) : (
            <table className="w-full border-collapse text-left text-body" aria-label="Regras de contribuição">
              <thead>
                <tr className="border-b border-border text-label uppercase text-ink-3">
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">Base</th>
                  <th className="py-2 pr-3 font-medium">Valor</th>
                  <th className="py-2 font-medium">Vigência</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-border">
                    <td className="py-2.5 pr-3 font-medium">{rule.type}</td>
                    <td className="py-2.5 pr-3 text-ink-2">{rule.calculation_base}</td>
                    <td className="py-2.5 pr-3 font-mono">
                      {rule.value_type === "percentual" ? `${rule.value}%` : rule.value}
                    </td>
                    <td className="py-2.5 font-mono text-ink-2">
                      {rule.valid_from} → {rule.valid_until ?? "atual"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {canWriteRule && <AddContributionRuleForm agreementId={agreement.id} />}

          <p className="text-label text-ink-3">
            <Link href="/convencoes" className="text-petrol-700 hover:underline">
              Voltar à lista
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
