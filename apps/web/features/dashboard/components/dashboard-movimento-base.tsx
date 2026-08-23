import { cn } from "@/lib/utils";
import { SyntexProgress } from "@/components/ui/syntex-progress";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { DEMO_MOVIMENTO_BASE, type DemoTone } from "@/features/dashboard/demo-painel";

const TONE_PROGRESS: Record<DemoTone, "teal" | "blue" | "green" | "amber" | "red"> = {
  syntex: "blue",
  teal: "teal",
  ok: "green",
  amber: "amber",
  critical: "red",
};

const TONE_TEXT: Record<DemoTone, string> = {
  syntex: "text-petrol-600",
  teal: "text-teal",
  ok: "text-success",
  amber: "text-warning",
  critical: "text-danger",
};

/**
 * Movimento da base — competência corrente.
 * Dados: DEV-only (`demo-painel.ts`).
 */
export function DashboardMovimentoBase() {
  return (
    <DashboardPanel title="Movimento da base" subtitle="Competência 08/2026">
      <ul className="px-5 py-3.5">
        {DEMO_MOVIMENTO_BASE.map((m) => (
          <li key={m.label} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-dense font-medium text-ink-2">{m.label}</span>
              <span className={cn("text-lg font-semibold tracking-[-0.02em] tabular-nums", TONE_TEXT[m.tone])}>
                {m.value}
              </span>
            </div>
            <div className="mt-2">
              <SyntexProgress value={m.delta} tone={TONE_PROGRESS[m.tone]} size="sm" label={m.label} />
            </div>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}
