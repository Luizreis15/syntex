import { ShieldCheck } from "lucide-react";
import { formatData } from "@/lib/formatters/data";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { DEMO_TRAB_ASSOCIACAO_STATS } from "@/features/workers/demo-trabalhador-360";
import { membershipYearsLabel } from "@/features/workers/trabalhador-360-compose";

export function Trabalhador360AssociacaoCard({
  status,
  since,
  branchLabel,
}: {
  status: string | null;
  since: string | null;
  branchLabel: string | null;
}) {
  const ativo = status === "ativo";
  const years = membershipYearsLabel(since);

  return (
    <DashboardPanel
      title="Associação"
      subtitle={
        since
          ? `${ativo ? "Ativa" : status ?? "—"} desde ${formatData(since)}`
          : ativo
            ? "Ativa"
            : "Sem filiação ativa"
      }
      variant="raised"
      rail="teal"
      action={<ShieldCheck className="size-4 text-teal" aria-hidden />}
    >
      <div className="px-5 py-4">
        <p className="font-mono text-4xl font-black text-petrol-600 tabular-nums">
          {years ?? "—"}
        </p>
        <p className="mt-1 font-mono text-label text-ink-3">
          {ativo ? "sem interrupção" : "histórico"}
          {branchLabel ? ` · ${branchLabel}` : ""}
          {!years ? " · demo" : ""}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {DEMO_TRAB_ASSOCIACAO_STATS.map((b) => (
            <div key={b.label} className="rounded-control bg-surface-2/80 px-3 py-2.5">
              <span className="text-label font-bold uppercase tracking-[0.1em] text-ink-3">
                {b.label}
              </span>
              <p className="mt-0.5 font-mono text-lg font-black text-ink tabular-nums">{b.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-label text-ink-3">Métricas de engajamento · demo</p>
      </div>
    </DashboardPanel>
  );
}
