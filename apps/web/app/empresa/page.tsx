import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant, primaryCompanyId } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchChargesPage } from "@/features/charges/data";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatCompetencia } from "@/lib/formatters/competencia";

export default async function EmpresaCobrancasPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "finance.read")) {
    return <SyntexEmptyState title="Sem permissão" description="finance.read é necessária." />;
  }

  const companyId = primaryCompanyId(session.grants);
  const rows = await fetchChargesPage(
    session.supabase,
    session.tenantId,
    searchParams.status,
    companyId,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-component font-semibold text-ink">Guias e cobranças</h2>
        <div className="flex gap-2 text-body">
          <FilterLink href="/empresa" active={!searchParams.status}>
            Todas
          </FilterLink>
          <FilterLink href="/empresa?status=pendente" active={searchParams.status === "pendente"}>
            Pendentes
          </FilterLink>
          <FilterLink href="/empresa?status=pago" active={searchParams.status === "pago"}>
            Pagas
          </FilterLink>
        </div>
      </div>

      {rows.length === 0 ? (
        <SyntexEmptyState
          title="Nenhuma cobrança"
          description="Quando o sindicato gerar uma guia para sua empresa, ela aparece aqui."
        />
      ) : (
        <table className="w-full border-collapse text-left text-body" aria-label="Cobranças da empresa">
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
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/empresa/cobrancas/${row.id}`}
                      className="font-mono text-petrol-700 hover:underline"
                    >
                      {obligation ? formatCompetencia(obligation.competence) : "—"}
                    </Link>
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
          ? "rounded-sm bg-surface-2 px-2 py-1 font-medium text-ink"
          : "rounded-sm px-2 py-1 text-ink-2 hover:text-ink"
      }
    >
      {children}
    </Link>
  );
}
