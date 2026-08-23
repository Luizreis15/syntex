import { cn } from "@/lib/utils";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { DEMO_TRAB_BENEFICIOS } from "@/features/workers/demo-trabalhador-360";

/** DEMO UI — benefícios. */
export function Trabalhador360Beneficios() {
  return (
    <DashboardPanel title="Benefícios" subtitle="4 disponíveis · 2 ativos · demo">
      <ul className="divide-y divide-border/55">
        {DEMO_TRAB_BENEFICIOS.map((b) => (
          <li key={b.name} className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="text-dense font-bold text-ink">{b.name}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-label font-bold",
                b.tone === "ok" ? "bg-tint-green text-success" : "bg-tint-blue text-petrol-600",
              )}
            >
              <i
                className={cn(
                  "size-1.5 rounded-full",
                  b.tone === "ok" ? "bg-success" : "bg-petrol-600",
                )}
                aria-hidden
              />
              {b.status}
            </span>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}
