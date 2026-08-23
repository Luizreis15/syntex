import { formatMoeda } from "@/lib/formatters/moeda";
import { formatInteiro } from "@/features/dashboard/format";
import { SyntexProgress } from "@/components/ui/syntex-progress";
import type { ChargeIntel } from "@/features/dashboard/charge-intel";
import { cn } from "@/lib/utils";

/**
 * Faixa de indicadores com tints semânticos + progress de pressão (vencido/aberto).
 */
export function DashboardChargeSummaryStrip({ intel }: { intel: ChargeIntel }) {
  const overdueShare =
    intel.openAmount > 0 ? (intel.overdueAmount / intel.openAmount) * 100 : 0;
  const due30Share = intel.openCount > 0 ? (intel.dueIn30Count / intel.openCount) * 100 : 0;

  const items = [
    {
      key: "open",
      label: "Em aberto",
      primary: formatMoeda(intel.openAmount),
      secondary: `${formatInteiro(intel.openCount)} cobranças`,
      tone: "ink" as const,
      tint: "bg-tint-blue",
      progress: null as number | null,
      progressTone: "blue" as const,
    },
    {
      key: "overdue-amt",
      label: "Vencido",
      primary: formatMoeda(intel.overdueAmount),
      secondary: `${formatInteiro(intel.overdueCount)} cobranças`,
      tone: "danger" as const,
      tint: "bg-tint-red",
      progress: overdueShare,
      progressTone: "red" as const,
    },
    {
      key: "d30",
      label: "Próx. 30 dias",
      primary: formatInteiro(intel.dueIn30Count),
      secondary: formatMoeda(intel.dueIn30Amount),
      tone: "warning" as const,
      tint: "bg-tint-amber",
      progress: due30Share,
      progressTone: "amber" as const,
    },
  ];

  const primaryTone = {
    ink: "text-ink",
    danger: "text-danger",
    warning: "text-warning",
  } as const;

  return (
    <div className="grid grid-cols-1 gap-px border-b border-border/50 bg-border/40 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.key} className={cn("space-y-2 px-4 py-3.5", item.tint)}>
          <p className="text-label font-semibold uppercase tracking-[0.06em] text-ink-3">{item.label}</p>
          <p
            className={cn(
              "font-mono text-section font-semibold tabular-nums tracking-tight",
              primaryTone[item.tone],
            )}
          >
            {item.primary}
          </p>
          {item.secondary ? (
            <p className="font-mono text-label text-ink-3">{item.secondary}</p>
          ) : null}
          {item.progress != null ? (
            <SyntexProgress
              value={item.progress}
              tone={item.progressTone}
              size="md"
              label={`${item.label} sobre aberto`}
            />
          ) : (
            <div className="h-2" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}
