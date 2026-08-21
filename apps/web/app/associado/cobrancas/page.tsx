import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveAssociateContext } from "@/lib/domain/associate-access";
import { fetchChargesPage } from "@/features/charges/data";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatCompetencia } from "@/lib/formatters/competencia";

/**
 * Cobranças das empresas onde o associado tem vínculo ativo.
 * (Obrigações ainda são por empresa — visão informativa no portal.)
 */
export default async function AssociadoCobrancasPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let ctx;
  try {
    ctx = await resolveAssociateContext(session.supabase, session.tenantId, session.appUserId);
  } catch {
    return <SyntexEmptyState title="Conta incompleta" description="Sem person vinculada." />;
  }

  if (!ctx.worker) {
    return (
      <SyntexEmptyState
        title="Sem papel de trabalhador"
        description="Não há worker vinculado à sua pessoa."
      />
    );
  }

  const { data: employments } = await session.supabase
    .from("employment_relationship")
    .select("company_id")
    .eq("tenant_id", session.tenantId)
    .eq("worker_id", ctx.worker.id)
    .eq("status", "ativo");

  const companyIds = [...new Set((employments ?? []).map((e) => e.company_id))];
  if (companyIds.length === 0) {
    return (
      <SyntexEmptyState
        title="Sem empresa ativa"
        description="Cobranças aparecem quando há vínculo empregatício ativo."
      />
    );
  }

  const all = await fetchChargesPage(session.supabase, session.tenantId);
  const rows = all.filter((row) => {
    const obligation = row.obligation as unknown as { company_id: string } | null;
    return obligation && companyIds.includes(obligation.company_id);
  });

  return (
    <div className="space-y-4">
      <h2 className="text-component font-semibold text-ink">Cobranças do ambiente de trabalho</h2>
      <p className="text-body text-ink-2">
        Guias das empresas onde você tem vínculo ativo. O pagamento da guia da empresa é feito no
        portal da empresa.
      </p>
      {rows.length === 0 ? (
        <SyntexEmptyState title="Nenhuma cobrança" description="Nenhuma guia aberta para suas empresas." />
      ) : (
        <table className="w-full border-collapse text-left text-body" aria-label="Cobranças">
          <thead>
            <tr className="border-b border-border text-label uppercase text-ink-3">
              <th className="py-2 pr-3 font-medium">Empresa</th>
              <th className="py-2 pr-3 font-medium">Competência</th>
              <th className="py-2 pr-3 font-medium">Valor</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const obligation = row.obligation as unknown as {
                competence: string;
                company: { trade_name: string | null; legal_name: string } | null;
              } | null;
              return (
                <tr key={row.id} className="border-b border-border">
                  <td className="py-2.5 pr-3">
                    {obligation?.company?.trade_name ?? obligation?.company?.legal_name ?? "—"}
                  </td>
                  <td className="py-2.5 pr-3 font-mono">
                    {obligation ? formatCompetencia(obligation.competence) : "—"}
                  </td>
                  <td className="py-2.5 pr-3 font-mono">{formatMoeda(Number(row.amount))}</td>
                  <td className="py-2.5 font-medium">{row.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="text-label text-ink-3">
        <Link href="/associado" className="text-petrol-700 hover:underline">
          Voltar à conta
        </Link>
      </p>
    </div>
  );
}
