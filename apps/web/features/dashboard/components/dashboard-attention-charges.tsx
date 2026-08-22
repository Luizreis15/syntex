import Link from "next/link";
import { Receipt } from "lucide-react";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatData } from "@/lib/formatters/data";
import { formatCnpj } from "@/lib/formatters/cnpj";
import { cn } from "@/lib/utils";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";

export interface AttentionChargeRow {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  companyName: string;
  companyCnpj: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  vencido: "Vencido",
  pago: "Pago",
  cancelado: "Cancelado",
};

function ChargeList({ rows }: { rows: AttentionChargeRow[] }) {
  return (
    <ul className="divide-y divide-border/60">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            href={`/cobrancas/${row.id}`}
            className="flex items-center gap-4 px-5 py-2.5 transition-colors hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-dense font-semibold text-ink">{row.companyName}</span>
              {row.companyCnpj ? (
                <span className="font-mono text-label text-ink-3">{formatCnpj(row.companyCnpj)}</span>
              ) : null}
            </span>
            <span className="hidden text-right sm:block">
              <span className="block font-mono text-dense font-semibold text-ink">
                {formatMoeda(row.amount)}
              </span>
              <span className="font-mono text-label text-ink-3">venc. {formatData(row.dueDate)}</span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-xs px-2 py-0.5 text-label font-semibold uppercase",
                row.status === "vencido" && "bg-danger/10 text-danger",
                row.status === "pendente" && "bg-warning/10 text-warning",
                row.status === "pago" && "bg-success/10 text-success",
                row.status === "cancelado" && "bg-surface-2 text-ink-3",
              )}
            >
              {STATUS_LABEL[row.status] ?? row.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ChargesEmptyPremium({ canOpenList }: { canOpenList: boolean }) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-xs bg-petrol-100 text-petrol-600">
          <Receipt size={13} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-dense font-semibold text-ink">Nenhuma cobrança exige atenção agora</p>
          <p className="mt-0.5 max-w-lg text-label leading-snug text-ink-3">
            Pendentes, vencidos ou emitidos recentemente aparecerão com a movimentação.
          </p>
          {canOpenList ? (
            <Link
              href="/cobrancas"
              className="mt-2 inline-flex items-center gap-1 text-label font-semibold text-petrol-600 transition-colors hover:text-petrol-700"
            >
              Ver cobranças
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Painel principal — dados reais ou empty state premium (só após query zero).
 */
export function DashboardAttentionCharges({
  openRows,
  recentRows,
}: {
  openRows: AttentionChargeRow[];
  recentRows: AttentionChargeRow[];
}) {
  if (openRows.length > 0) {
    return (
      <DashboardPanel
        title="Cobranças que pedem atenção"
        subtitle="Pendentes e vencidas · por vencimento"
        action={
          <Link
            href="/cobrancas"
            className="text-label font-semibold text-petrol-600 transition-colors hover:text-petrol-700"
          >
            Ver todas
          </Link>
        }
      >
        <ChargeList rows={openRows} />
      </DashboardPanel>
    );
  }

  if (recentRows.length > 0) {
    return (
      <DashboardPanel
        title="Cobranças recentes"
        subtitle="Fila em aberto vazia · últimos registros"
        action={
          <Link
            href="/cobrancas"
            className="text-label font-semibold text-petrol-600 transition-colors hover:text-petrol-700"
          >
            Ver todas
          </Link>
        }
      >
        <ChargeList rows={recentRows} />
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel title="Cobranças" subtitle="Consulta realizada nesta sessão">
      <ChargesEmptyPremium canOpenList />
    </DashboardPanel>
  );
}
