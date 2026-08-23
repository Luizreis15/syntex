import type { DueBucket } from "@/features/dashboard/charge-intel";
import { formatInteiro } from "@/features/dashboard/format";
import { SyntexProgress } from "@/components/ui/syntex-progress";
import type { SyntexAccentTone } from "@/components/ui/syntex-accent-rail";
import { cn } from "@/lib/utils";

const BUCKET_TONE: Record<DueBucket["key"], SyntexAccentTone> = {
  vencidas: "red",
  d0_7: "amber",
  d8_15: "amber",
  d16_30: "blue",
  d31_60: "teal",
  d60_plus: "teal",
};

const BUCKET_TINT: Record<DueBucket["key"], string> = {
  vencidas: "bg-tint-red",
  d0_7: "bg-tint-amber",
  d8_15: "bg-tint-amber",
  d16_30: "bg-tint-blue",
  d31_60: "bg-tint-teal",
  d60_plus: "bg-tint-teal",
};

/**
 * Distribuição por vencimento com SyntexProgress + tints — micro-viz perceptível.
 */
export function DashboardDueDistribution({ buckets }: { buckets: DueBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const hasAny = buckets.some((b) => b.count > 0);
  if (!hasAny) return null;

  return (
    <div className="border-b border-border/50 px-5 py-4">
      <p className="text-label font-semibold uppercase tracking-[0.06em] text-ink-3">
        Distribuição por vencimento
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {buckets.map((bucket) => {
          const pct = (bucket.count / max) * 100;
          return (
            <li
              key={bucket.key}
              className={cn(
                "space-y-1.5 rounded-control px-3 py-2.5",
                BUCKET_TINT[bucket.key],
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-label font-semibold text-ink-2">{bucket.label}</span>
                <span className="font-mono text-dense font-semibold tabular-nums text-ink">
                  {formatInteiro(bucket.count)}
                </span>
              </div>
              <SyntexProgress
                value={pct}
                tone={BUCKET_TONE[bucket.key]}
                size="md"
                label={bucket.label}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
