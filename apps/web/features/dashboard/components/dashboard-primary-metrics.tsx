import Link from "next/link";
import { cn } from "@/lib/utils";
import type { HeroMetric } from "@/features/dashboard/compose";

const VALUE_TONE: Record<NonNullable<HeroMetric["tone"]>, string> = {
  default: "text-shell-ink",
  warning: "text-warning",
  danger: "text-danger",
  teal: "text-teal",
};

/**
 * Summary flat — um sistema, sem cards.
 * Primária ≈ 1.2× secundária; valor domina; divisores só verticais.
 */
export function DashboardPrimaryMetrics({ metrics }: { metrics: HeroMetric[] }) {
  if (metrics.length === 0) {
    return (
      <p className="mt-3 text-label text-shell-ink-2">
        Nenhuma métrica disponível para o seu perfil neste momento.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap">
      {metrics.map((metric, index) => {
        const value = (
          <span
            className={cn(
              "font-mono tracking-tight text-shell-ink",
              metric.size === "primary" ? "text-page-title font-bold" : "text-section font-semibold",
              VALUE_TONE[metric.tone ?? "default"],
            )}
          >
            {metric.value}
          </span>
        );

        return (
          <div
            key={metric.key}
            className={cn(
              "flex min-w-[8.5rem] flex-1 flex-col gap-0.5 py-2.5 pr-5",
              index > 0 && "border-l border-shell-border/70 pl-5",
              metric.size === "primary" ? "basis-[11rem]" : "basis-[8rem]",
            )}
          >
            <span className="text-label font-semibold uppercase tracking-[0.08em] text-shell-ink-2/80">
              {metric.label}
            </span>
            {metric.href ? (
              <Link
                href={metric.href}
                className="w-fit transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petrol-600"
              >
                {value}
              </Link>
            ) : (
              value
            )}
            {metric.hint ? (
              <span className="text-label font-normal text-shell-ink-2/65">{metric.hint}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
