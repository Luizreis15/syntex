import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  SyntexAccentFrame,
  type SyntexAccentTone,
} from "@/components/ui/syntex-accent-rail";

export type SyntexMetricSize = "primary" | "secondary" | "inline";

export interface SyntexMetricProps {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "danger" | "teal" | "success";
  size?: SyntexMetricSize;
  /** Superfície dark (radar / hero). */
  onDark?: boolean;
  rail?: SyntexAccentTone;
  visual?: ReactNode;
  className?: string;
}

const VALUE_TONE_LIGHT: Record<NonNullable<SyntexMetricProps["tone"]>, string> = {
  default: "text-ink",
  warning: "text-warning",
  danger: "text-danger",
  teal: "text-teal",
  success: "text-success",
};

const VALUE_TONE_DARK: Record<NonNullable<SyntexMetricProps["tone"]>, string> = {
  default: "text-shell-ink",
  warning: "text-warning",
  danger: "text-danger",
  teal: "text-teal",
  success: "text-success",
};

const SIZE_VALUE: Record<SyntexMetricSize, string> = {
  primary: "font-mono text-metric font-semibold tabular-nums",
  secondary: "font-mono text-metric-sm font-semibold tabular-nums",
  inline: "font-mono text-component font-semibold tabular-nums",
};

/**
 * Linguagem de métrica v2.1 — LABEL / VALUE / CONTEXT / VISUAL opcional.
 * Valor domina. Não impõe card; quem agrupa decide a moldura.
 */
export function SyntexMetric({
  label,
  value,
  hint,
  href,
  tone = "default",
  size = "secondary",
  onDark = false,
  rail,
  visual,
  className,
}: SyntexMetricProps) {
  const tones = onDark ? VALUE_TONE_DARK : VALUE_TONE_LIGHT;
  const labelClass = onDark ? "text-shell-ink-2/80" : "text-ink-3";
  const hintClass = onDark ? "text-shell-ink-2/65" : "text-ink-3";

  const valueNode = (
    <span className={cn(SIZE_VALUE[size], tones[tone])}>{value}</span>
  );

  const body = (
    <div className={cn("flex flex-col gap-0.5", rail && "pl-3", className)}>
      <span className={cn("text-label font-medium uppercase tracking-[0.06em]", labelClass)}>
        {label}
      </span>
      {href ? (
        <Link
          href={href}
          className="w-fit transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petrol-600"
        >
          {valueNode}
        </Link>
      ) : (
        valueNode
      )}
      {hint ? <span className={cn("text-label font-normal", hintClass)}>{hint}</span> : null}
      {visual ? <div className="mt-2">{visual}</div> : null}
    </div>
  );

  if (rail) {
    return (
      <SyntexAccentFrame tone={rail} className="py-0.5">
        {body}
      </SyntexAccentFrame>
    );
  }

  return body;
}

/** Barra de métricas com divisores — alternativa ao card-grid. */
export function SyntexMetricBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap divide-x divide-border rounded-panel border border-border/60 bg-surface shadow-surface [&>*]:px-5 [&>*]:py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
