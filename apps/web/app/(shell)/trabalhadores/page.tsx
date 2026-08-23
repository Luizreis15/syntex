import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import {
  fetchWorkersPage,
  fetchWorkersStatusSummary,
} from "@/features/workers/data";
import { TrabalhadoresListHeader } from "@/features/workers/components/trabalhadores-list-header";
import { formatCpf } from "@/lib/formatters/cpf";
import { formatInteiro } from "@/features/dashboard/format";
import { cn } from "@/lib/utils";

/**
 * Listagem Trabalhadores — P2.1: tipografia/alinhamento irmãos de /empresas.
 */
export default async function TrabalhadoresPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "worker.read")) {
    return (
      <div className="px-6 py-12">
        <SyntexEmptyState title="Sem permissão" description="worker.read é necessária." />
      </div>
    );
  }

  const pageIndex = Math.max(0, Number(searchParams.page ?? "1") - 1);
  const canWrite = hasAnyGrant(session.grants, "worker.write");
  const canReadMembership = hasAnyGrant(session.grants, "membership.read");

  const [{ rows, total }, summary] = await Promise.all([
    fetchWorkersPage(session.supabase, session.tenantId, session.grants, {
      q: searchParams.q,
      pageIndex,
      pageSize: 20,
    }),
    fetchWorkersStatusSummary(session.supabase, session.tenantId, session.grants),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="min-h-full bg-paper">
      <TrabalhadoresListHeader summary={summary} canCreate={canWrite} />

      <div className="px-6 py-5 xl:px-8">
        <div className="overflow-hidden rounded-panel border border-border/45 bg-surface shadow-surface">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/40 px-4 py-2.5">
            <form className="flex h-9 w-full max-w-sm items-center gap-2 rounded-control border border-border/70 bg-paper px-2.5">
              <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
              <input
                name="q"
                defaultValue={searchParams.q ?? ""}
                placeholder="Filtrar por nome ou CPF…"
                className="h-full w-full bg-transparent text-dense font-medium text-ink outline-none placeholder:text-ink-3"
              />
            </form>
            <span className="font-mono text-label text-ink-3">
              {formatInteiro(total)} registro{total === 1 ? "" : "s"}
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="p-8">
              <SyntexEmptyState
                title="Nenhum trabalhador"
                description="Cadastre o primeiro vínculo da base."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full table-fixed border-collapse text-left"
                aria-label="Trabalhadores"
              >
                <colgroup>
                  <col className="w-[50%]" />
                  <col className="w-[28%]" />
                  <col className="w-[22%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/40 bg-surface-2/50">
                    <th className="h-9 px-4 text-left text-label font-semibold uppercase tracking-[0.08em] text-ink-3">
                      Trabalhador
                    </th>
                    <th className="h-9 px-4 text-left text-label font-semibold uppercase tracking-[0.08em] text-ink-3">
                      Empresa
                    </th>
                    <th className="h-9 px-4 text-left text-label font-semibold uppercase tracking-[0.08em] text-ink-3">
                      Filiação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const ativo = row.membership_status === "ativo";
                    return (
                      <tr
                        key={row.worker_id}
                        className="h-[52px] border-b border-border/30 transition-[background-color] duration-150 last:border-0 hover:bg-tint-blue"
                      >
                        <td className="px-4 align-middle">
                          <Link
                            href={`/trabalhadores/${row.worker_id}`}
                            className="group block min-w-0 py-0.5"
                          >
                            <span className="block truncate text-dense font-semibold text-ink group-hover:text-petrol-700">
                              {row.full_name}
                            </span>
                            <span className="mt-0.5 block font-mono text-label text-ink-3">
                              {formatCpf(row.cpf)}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 align-middle">
                          {row.company_name ? (
                            <span className="block truncate text-dense font-medium text-ink-2">
                              {row.company_name}
                            </span>
                          ) : (
                            <span className="text-label font-medium text-ink-3">
                              Sem vínculo ativo
                            </span>
                          )}
                        </td>
                        <td className="px-4 align-middle">
                          {!canReadMembership ? (
                            <span className="text-label text-ink-3">—</span>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-control px-2 py-0.5 text-label font-semibold uppercase tracking-wide",
                                ativo
                                  ? "bg-tint-green text-success"
                                  : row.membership_status
                                    ? "bg-surface-2 text-ink-2"
                                    : "bg-tint-amber text-warning",
                              )}
                            >
                              <i
                                className={cn(
                                  "size-1.5 shrink-0 rounded-full",
                                  ativo
                                    ? "bg-success"
                                    : row.membership_status
                                      ? "bg-ink-3"
                                      : "bg-warning",
                                )}
                                aria-hidden
                              />
                              {ativo
                                ? "Associado"
                                : row.membership_status
                                  ? row.membership_status
                                  : "Sem filiação"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {total > 20 ? (
            <div className="flex items-center justify-end gap-3 border-t border-border/40 px-4 py-2.5 text-label text-ink-3">
              <span className="font-mono">
                Página {pageIndex + 1} de {pageCount}
              </span>
              {pageIndex > 0 ? (
                <Link
                  href={`/trabalhadores?page=${pageIndex}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}`}
                  className="font-semibold text-petrol-600 hover:underline"
                >
                  Anterior
                </Link>
              ) : null}
              {pageIndex + 1 < pageCount ? (
                <Link
                  href={`/trabalhadores?page=${pageIndex + 2}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}`}
                  className="font-semibold text-petrol-600 hover:underline"
                >
                  Próxima
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
