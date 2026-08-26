import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { DashboardPrimaryMetrics } from "@/features/dashboard/components/dashboard-primary-metrics";
import type { LovableHeroBlock } from "@/features/dashboard/compose";
import { DEMO_STATUS } from "@/features/dashboard/demo-painel";
import { cn } from "@/lib/utils";

export interface DashboardCommandHeroProps {
  clockLabel: string;
  greetingLine: string;
  contextLine: string;
  block: LovableHeroBlock;
  alertCount?: number;
}

function StatusChip({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "ok" | "amber";
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-control bg-shell-ink/[0.08] px-2.5 py-1 text-label font-semibold tracking-wide text-shell-ink/95 ring-1 ring-inset ring-shell-ink/[0.06]">
      <i
        className={cn(
          "size-1.5 rounded-full",
          tone === "ok" && "bg-success",
          tone === "amber" && "bg-warning",
        )}
        aria-hidden
      />
      {children}
    </span>
  );
}

/**
 * Command Hero — altura e composição preservadas; acabamento P1.
 * Chips de status / refresh: DEMO DEV-only (`demo-painel.ts`).
 */
export function DashboardCommandHero({
  clockLabel,
  greetingLine,
  contextLine,
  block,
  alertCount = DEMO_STATUS.alertsCount,
}: DashboardCommandHeroProps) {
  return (
    <section
      className="relative overflow-hidden text-shell-ink"
      style={{
        background: [
          "radial-gradient(90% 70% at 88% 0%, color-mix(in oklab, var(--teal) 10%, transparent), transparent 52%)",
          "linear-gradient(115deg, oklch(0.165 0.036 252) 0%, oklch(0.2 0.042 252) 42%, oklch(0.24 0.048 248) 100%)",
        ].join(", "),
      }}
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dashboard-hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="var(--shell-border)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dashboard-hero-grid)" />
      </svg>

      <div className="relative px-6 pt-7 pb-8 xl:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-label uppercase tracking-[0.12em] text-teal/90">{clockLabel}</p>
            <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-[-0.035em] text-shell-ink">
              {greetingLine}
            </h1>
            <p className="mt-2.5 text-sm font-medium text-shell-ink-2">{contextLine}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="ok">{DEMO_STATUS.operation}</StatusChip>
            <StatusChip tone="amber">{alertCount} alertas</StatusChip>
            <span className="inline-flex items-center gap-1.5 font-mono text-label text-shell-ink-2/80">
              <RefreshCw className="size-3 opacity-80" aria-hidden /> {DEMO_STATUS.refreshedLabel}
            </span>
            <span className="font-mono text-label uppercase tracking-[0.08em] text-shell-ink-2/70">
              status DEMO
            </span>
          </div>
        </div>

        <DashboardPrimaryMetrics block={block} />
      </div>
    </section>
  );
}
