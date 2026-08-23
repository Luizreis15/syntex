import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatCnpj } from "@/lib/formatters/cnpj";
import { cn } from "@/lib/utils";
import type { AttentionChargeRow } from "@/features/dashboard/components/dashboard-attention-charges";

export interface PriorityCompanyRow {
  id: string;
  name: string;
  cnpj: string | null;
  amount: number;
  status: string;
}

/**
 * Empresas ordenadas por impacto em cobranças abertas (seed real quando houver).
 */
export function DashboardPriorityCompanies({ rows }: { rows: PriorityCompanyRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[0.95rem] font-extrabold tracking-tight text-ink">
            Empresas com prioridade de contato
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-3">
            <Clock className="size-3" aria-hidden /> ordenadas por impacto na arrecadação
          </p>
        </div>
        <Link
          href="/empresas"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-petrol-600 hover:underline"
        >
          Abrir empresas <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="surface-raised overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border/50 text-label font-semibold uppercase tracking-[0.06em] text-ink-3">
              <th className="px-4 py-2.5 font-semibold">Empresa</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">CNPJ</th>
              <th className="px-4 py-2.5 font-semibold text-right">Em aberto</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((row) => {
              const overdue = row.status === "vencido";
              return (
                <tr key={row.id} className="row-hover">
                  <td className="px-4 py-3">
                    <Link
                      href={`/cobrancas/${row.id}`}
                      className="text-dense font-semibold text-ink hover:underline"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-label text-ink-3 md:table-cell">
                    {row.cnpj ? formatCnpj(row.cnpj) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-dense font-semibold tabular-nums text-ink">
                    {formatMoeda(row.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-control px-2 py-0.5 text-label font-semibold uppercase tracking-wide",
                        overdue ? "bg-tint-red text-danger" : "bg-tint-amber text-warning",
                      )}
                    >
                      {overdue ? "Vencido" : "Pendente"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function priorityFromAttention(rows: AttentionChargeRow[]): PriorityCompanyRow[] {
  const byCompany = new Map<string, PriorityCompanyRow>();
  for (const row of rows) {
    const key = row.companyCnpj ?? row.companyName;
    const prev = byCompany.get(key);
    if (!prev) {
      byCompany.set(key, {
        id: row.id,
        name: row.companyName,
        cnpj: row.companyCnpj,
        amount: row.amount,
        status: row.status,
      });
      continue;
    }
    byCompany.set(key, {
      ...prev,
      amount: prev.amount + row.amount,
      status: prev.status === "vencido" || row.status === "vencido" ? "vencido" : row.status,
    });
  }
  return [...byCompany.values()].sort((a, b) => b.amount - a.amount).slice(0, 6);
}
