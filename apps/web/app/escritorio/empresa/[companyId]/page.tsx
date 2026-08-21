import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { can, isOfficePortalActor } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchChargesPage } from "@/features/charges/data";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatCompetencia } from "@/lib/formatters/competencia";

export default async function EscritorioEmpresaPage({
  params,
  searchParams,
}: {
  params: { companyId: string };
  searchParams: { status?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isOfficePortalActor(session.grants)) redirect("/empresas");

  if (
    !can(session.grants, "finance.read", session.tenantId, {
      tenantId: session.tenantId,
      companyId: params.companyId,
    })
  ) {
    return (
      <SyntexEmptyState
        title="Sem delegação"
        description="Esta empresa não está sob sua delegação ativa."
      />
    );
  }

  const { data: company } = await session.supabase
    .from("company")
    .select("legal_name, trade_name, cnpj")
    .eq("tenant_id", session.tenantId)
    .eq("id", params.companyId)
    .maybeSingle();
  if (!company) notFound();

  const rows = await fetchChargesPage(
    session.supabase,
    session.tenantId,
    searchParams.status,
    params.companyId,
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-label text-ink-3">
          <Link href="/escritorio" className="text-petrol-700 hover:underline">
            ← Empresas
          </Link>
        </p>
        <h2 className="text-component font-semibold text-ink">
          {company.trade_name ?? company.legal_name}
        </h2>
        <p className="font-mono text-body text-ink-2">{company.cnpj}</p>
      </div>

      {rows.length === 0 ? (
        <SyntexEmptyState title="Nenhuma cobrança" description="Sem guias para esta empresa." />
      ) : (
        <table className="w-full border-collapse text-left text-body" aria-label="Cobranças">
          <thead>
            <tr className="border-b border-border text-label uppercase text-ink-3">
              <th className="py-2 pr-3 font-medium">Competência</th>
              <th className="py-2 pr-3 font-medium">Valor</th>
              <th className="py-2 pr-3 font-medium">Vencimento</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const obligation = row.obligation as unknown as { competence: string } | null;
              return (
                <tr key={row.id} className="border-b border-border">
                  <td className="py-2.5 pr-3 font-mono">
                    {obligation ? formatCompetencia(obligation.competence) : "—"}
                  </td>
                  <td className="py-2.5 pr-3 font-mono">{formatMoeda(Number(row.amount))}</td>
                  <td className="py-2.5 pr-3 font-mono text-ink-2">{row.due_date}</td>
                  <td className="py-2.5 font-medium">{row.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
