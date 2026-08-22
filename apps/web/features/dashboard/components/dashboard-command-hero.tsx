import type { ReactNode } from "react";
import { DashboardPrimaryMetrics } from "@/features/dashboard/components/dashboard-primary-metrics";
import type { HeroMetric } from "@/features/dashboard/compose";

export interface DashboardCommandHeroProps {
  clockLabel: string;
  greetingLine: string;
  contextLine: string;
  metrics: HeroMetric[];
  status?: ReactNode;
}

/**
 * Command Header operacional (~180–230px).
 * Gradiente 115deg sofisticado + grid quase imperceptível.
 */
export function DashboardCommandHero({
  clockLabel,
  greetingLine,
  contextLine,
  metrics,
  status,
}: DashboardCommandHeroProps) {
  return (
    <section
      className="relative overflow-hidden text-shell-ink"
      style={{
        background: [
          "radial-gradient(90% 70% at 88% 0%, color-mix(in oklab, var(--teal) 8%, transparent), transparent 52%)",
          "linear-gradient(115deg, oklch(0.165 0.036 252) 0%, oklch(0.2 0.042 252) 42%, oklch(0.24 0.048 248) 100%)",
        ].join(", "),
      }}
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dashboard-hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="var(--shell-border)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dashboard-hero-grid)" />
      </svg>

      <div className="relative px-6 py-4 xl:px-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-label uppercase tracking-wide text-teal/90">{clockLabel}</p>
            <h1 className="mt-1 text-component font-semibold tracking-tight text-shell-ink">
              {greetingLine}
            </h1>
            <p className="mt-0.5 text-label font-medium text-shell-ink-2">{contextLine}</p>
          </div>
          {status ? <div className="flex flex-wrap items-center gap-2">{status}</div> : null}
        </div>

        <DashboardPrimaryMetrics metrics={metrics} />
      </div>
    </section>
  );
}
