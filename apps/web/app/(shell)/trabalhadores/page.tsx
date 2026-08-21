import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchWorkersPage } from "@/features/workers/data";
import { formatCpf } from "@/lib/formatters/cpf";

export default async function TrabalhadoresPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "worker.read")) {
    return (
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Cadastro" }, { label: "Trabalhadores" }]} title="Trabalhadores" />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="worker.read é necessária." />
        </div>
      </div>
    );
  }

  const pageIndex = Math.max(0, Number(searchParams.page ?? "1") - 1);
  const { rows, total } = await fetchWorkersPage(session.supabase, session.tenantId, session.grants, {
    q: searchParams.q,
    pageIndex,
    pageSize: 20,
  });
  const canWrite = hasAnyGrant(session.grants, "worker.write");

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Cadastro" }, { label: "Trabalhadores" }]}
        title="Trabalhadores"
        metadata={<span className="text-body text-ink-2">{total} registro(s)</span>}
        actions={
          canWrite ? (
            <Link
              href="/trabalhadores/novo"
              className="inline-flex h-input items-center rounded-sm bg-petrol-800 px-3 text-body text-shell-ink"
            >
              Novo trabalhador
            </Link>
          ) : null
        }
      />
      <div className="space-y-4 p-6">
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Buscar por nome ou CPF"
            className="h-input max-w-sm flex-1 rounded-sm border border-border bg-surface px-2 text-body"
          />
          <button type="submit" className="h-input rounded-sm border border-border-strong px-3 text-body">
            Buscar
          </button>
        </form>

        {rows.length === 0 ? (
          <SyntexEmptyState title="Nenhum trabalhador" description="Cadastre o primeiro vínculo da base." />
        ) : (
          <table className="w-full border-collapse text-left text-body" aria-label="Trabalhadores">
            <thead>
              <tr className="border-b border-border text-label uppercase text-ink-3">
                <th className="py-2 pr-3 font-medium">Nome</th>
                <th className="py-2 pr-3 font-medium">CPF</th>
                <th className="py-2 pr-3 font-medium">Empresa</th>
                <th className="py-2 font-medium">Filiação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.worker_id} className="border-b border-border">
                  <td className="py-2.5 pr-3">
                    <Link href={`/trabalhadores/${row.worker_id}`} className="font-medium text-petrol-700 hover:underline">
                      {row.full_name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-ink-2">{formatCpf(row.cpf)}</td>
                  <td className="py-2.5 pr-3 text-ink-2">{row.company_name ?? "—"}</td>
                  <td className="py-2.5 font-medium">{row.membership_status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
