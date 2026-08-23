import { SyntexProgress } from "@/components/ui/syntex-progress";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import {
  DEMO_TRAB_FINANCEIRO,
  DEMO_TRAB_MENSALIDADE,
} from "@/features/workers/demo-trabalhador-360";

const TONE = { ok: "green", syntex: "blue", teal: "teal" } as const;

/** DEMO UI — financeiro do associado. */
export function Trabalhador360Financeiro() {
  return (
    <DashboardPanel title="Financeiro" subtitle={`Mensalidade ${DEMO_TRAB_MENSALIDADE} · demo`}>
      <div className="space-y-3 px-5 py-4">
        {DEMO_TRAB_FINANCEIRO.map((f) => (
          <div key={f.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-ink-3">{f.label}</span>
              <span className="font-mono text-sm font-extrabold tabular-nums text-ink">{f.value}</span>
            </div>
            <div className="mt-1.5">
              <SyntexProgress value={f.pct} tone={TONE[f.tone]} size="sm" label={f.label} />
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
