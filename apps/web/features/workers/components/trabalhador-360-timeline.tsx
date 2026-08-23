import { cn } from "@/lib/utils";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { DEMO_TRAB_TIMELINE } from "@/features/workers/demo-trabalhador-360";

const TONE_DOT = {
  syntex: "bg-petrol-600",
  teal: "bg-teal",
  ok: "bg-success",
  amber: "bg-warning",
  critical: "bg-danger",
} as const;

/** DEMO UI — timeline operacional do trabalhador. */
export function Trabalhador360Timeline() {
  return (
    <DashboardPanel
      title="Syntex Timeline"
      subtitle="Histórico operacional consolidado · demo"
      action={
        <button type="button" className="text-label font-bold text-ink-3 hover:text-ink">
          Filtrar áreas
        </button>
      }
    >
      <ol className="relative px-5 py-4">
        <span className="absolute top-6 bottom-6 left-[6.6rem] w-px bg-border" aria-hidden />
        {DEMO_TRAB_TIMELINE.map((it) => (
          <li key={it.when + it.title} className="group relative flex gap-4 py-2.5">
            <span className="w-20 shrink-0 pt-0.5 text-right font-mono text-label text-ink-3">
              {it.when}
            </span>
            <span className="relative mt-1.5 flex w-4 shrink-0 justify-center">
              <i
                className={cn(
                  "size-2 rounded-full ring-4 ring-surface transition-transform group-hover:scale-125",
                  TONE_DOT[it.tone],
                )}
                aria-hidden
              />
            </span>
            <span className="min-w-0 flex-1 pb-1">
              <span className="block text-sm font-bold text-ink">{it.title}</span>
              {it.detail ? <span className="block text-xs text-ink-3">{it.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </DashboardPanel>
  );
}
