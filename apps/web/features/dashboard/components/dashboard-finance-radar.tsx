import Link from "next/link";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatInteiro } from "@/features/dashboard/format";
import { SyntexProgress } from "@/components/ui/syntex-progress";
import {
  SyntexPanel,
  SyntexPanelBody,
  SyntexPanelHeaderDark,
} from "@/components/ui/syntex-panel";
import type { ChargeIntel } from "@/features/dashboard/charge-intel";
import { cn } from "@/lib/utils";

export interface DashboardFinanceRadarProps {
  intel: ChargeIntel;
}

function share(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return (part / whole) * 100;
}

/**
 * Radar visual — composição de exposição + tracks, não lista tabular.
 */
export function DashboardFinanceRadar({ intel }: DashboardFinanceRadarProps) {
  const overdueShare = share(intel.overdueAmount, intel.openAmount);
  const due30Share = share(intel.dueIn30Amount, intel.openAmount);
  const restShare = Math.max(0, 100 - overdueShare - due30Share);

  return (
    <SyntexPanel variant="dark" rail="teal" className="shadow-raised">
      <SyntexPanelHeaderDark>
        <div>
          <h2 className="text-dense font-semibold tracking-tight text-shell-ink">Radar financeiro</h2>
          <p className="mt-0.5 text-label font-medium text-shell-ink-2/80">Exposição em aberto</p>
        </div>
        <Link
          href="/cobrancas"
          className="text-label font-semibold text-teal transition-opacity hover:opacity-85"
        >
          Ver →
        </Link>
      </SyntexPanelHeaderDark>

      <SyntexPanelBody className="space-y-4 px-3.5 py-3.5">
        <div className="rounded-control bg-shell-ink/[0.05] px-3 py-3">
          <p className="text-label font-semibold uppercase tracking-[0.06em] text-shell-ink-2/75">
            Valor em aberto
          </p>
          <p className="mt-1 font-mono text-metric font-semibold tabular-nums tracking-tight text-teal">
            {formatMoeda(intel.openAmount)}
          </p>
          <p className="mt-0.5 text-label text-shell-ink-2/65">
            {formatInteiro(intel.openCount)} cobranças · maior {formatMoeda(intel.maxAmount)}
          </p>
        </div>

        {intel.openAmount > 0 ? (
          <div className="space-y-2">
            <p className="text-label font-semibold uppercase tracking-[0.06em] text-shell-ink-2/75">
              Composição da exposição
            </p>
            <div
              className="flex h-2.5 overflow-hidden rounded-full bg-track-dark"
              role="img"
              aria-label={`Vencido ${Math.round(overdueShare)}%, a vencer 30 dias ${Math.round(due30Share)}%, demais ${Math.round(restShare)}%`}
            >
              {overdueShare > 0 ? (
                <span className="h-full bg-danger" style={{ width: `${overdueShare}%` }} />
              ) : null}
              {due30Share > 0 ? (
                <span className="h-full bg-warning" style={{ width: `${due30Share}%` }} />
              ) : null}
              {restShare > 0 ? (
                <span className="h-full bg-petrol-600/70" style={{ width: `${restShare}%` }} />
              ) : null}
            </div>
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-label text-shell-ink-2/75">
              <LegendDot className="bg-danger" label="Vencido" />
              <LegendDot className="bg-warning" label="30 dias" />
              <LegendDot className="bg-petrol-600/70" label="Demais" />
            </ul>
          </div>
        ) : null}

        <div className="space-y-3 border-t border-shell-border/40 pt-3">
          <RadarTrack
            label="Vencidas"
            valueLabel={`${formatInteiro(intel.overdueCount)} · ${formatMoeda(intel.overdueAmount)}`}
            progress={overdueShare}
            tone="red"
          />
          <RadarTrack
            label="A vencer · 30 dias"
            valueLabel={`${formatInteiro(intel.dueIn30Count)} · ${formatMoeda(intel.dueIn30Amount)}`}
            progress={due30Share}
            tone="amber"
          />
        </div>
      </SyntexPanelBody>
    </SyntexPanel>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", className)} aria-hidden />
      {label}
    </li>
  );
}

function RadarTrack({
  label,
  valueLabel,
  progress,
  tone,
}: {
  label: string;
  valueLabel: string;
  progress: number;
  tone: "red" | "amber";
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-label font-semibold uppercase tracking-[0.05em] text-shell-ink-2/80">
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-dense font-semibold tabular-nums",
            tone === "red" ? "text-danger" : "text-warning",
          )}
        >
          {valueLabel}
        </span>
      </div>
      <SyntexProgress value={progress} tone={tone} dark size="md" label={label} />
    </div>
  );
}
