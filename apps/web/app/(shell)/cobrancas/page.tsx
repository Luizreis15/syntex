import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchChargesPage } from "@/features/charges/data";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatCompetencia } from "@/lib/formatters/competencia";

export default async function CobrancasPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "finance.read")) {
    return (
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Financeiro" }, { label: "Cobrança" }]} title="Cobranças" />
        <div className="p-6">
          <SyntexEmptyState
            title="Sem permissão para ver cobranças"
            description="É necessária a permissão finance.read."
          />
        </div>
      </div>
    );
  }

  const rows = await fetchChargesPage(session.supabase, session.tenantId, searchParams.status);
  const canWrite = hasAnyGrant(session.grants, "finance.write");

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Financeiro" }, { label: "Cobrança" }]}
        title="Cobranças"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/cobrancas/modelos" className="text-body text-petrol-700 hover:underline">
              Planos de arrecadação
            </Link>
            <Link href="/cobrancas/resolver" className="text-body text-petrol-700 hover:underline">
              Apurar competência
            </Link>
            {canWrite ? (
              <Link
                href="/cobrancas/nova"
                className="inline-flex h-input items-center rounded-sm bg-petrol-800 px-3 text-body text-shell-ink"
              >
                Gerar cobrança
              </Link>
            ) : null}
          </div>
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex gap-2 text-body">
          <FilterLink href="/cobrancas" active={!searchParams.status}>
            Todas
          </FilterLink>
          <FilterLink href="/cobrancas?status=pendente" active={searchParams.status === "pendente"}>
            Pendentes
          </FilterLink>
          <FilterLink href="/cobrancas?status=pago" active={searchParams.status === "pago"}>
            Pagas
          </FilterLink>
        </div>

        {rows.length === 0 ? (
          <SyntexEmptyState
            title="Nenhuma cobrança"
            description="Gere uma obrigação a partir de uma regra de contribuição vigente."
          />
        ) : (
          <table className="w-full border-collapse text-left text-body" aria-label="Cobranças">
            <thead>
              <tr className="border-b border-border text-label uppercase text-ink-3">
                <th className="py-2 pr-3 font-medium">Empresa</th>
                <th className="py-2 pr-3 font-medium">Competência</th>
                <th className="py-2 pr-3 font-medium">Valor</th>
                <th className="py-2 pr-3 font-medium">Vencimento</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const obligation = row.obligation as unknown as {
                  competence: string;
                  company: { legal_name: string; trade_name: string | null; cnpj: string } | null;
                } | null;
                const company = obligation?.company;
                return (
                  <tr key={row.id} className="border-b border-border">
                    <td className="py-2.5 pr-3">
                      <Link href={`/cobrancas/${row.id}`} className="font-medium text-petrol-700 hover:underline">
                        {company?.trade_name ?? company?.legal_name ?? "—"}
                      </Link>
                      <p className="font-mono text-label text-ink-2">{company?.cnpj}</p>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-ink-2">
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
