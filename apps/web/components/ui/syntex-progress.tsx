import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { SyntexAccentTone } from "@/components/ui/syntex-accent-rail";

const FILL: Record<SyntexAccentTone, string> = {
  teal: "bg-teal",
  blue: "bg-petrol-600",
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-danger",
};

export interface SyntexProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** 0–100. Valores fora do intervalo são clampados. */
  value: number;
  tone?: SyntexAccentTone;
  /** Superfície dark (radar / command). */
  dark?: boolean;
  /** Densidade visual. */
  size?: "sm" | "md";
  label?: string;
}

export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * Track neutro + fill semântico. Só use com denominador real
 * (proporção, progresso, composição). Sem denominador → não renderize.
 */
export function SyntexProgress({
  value,
  tone = "teal",
  dark = false,
  size = "sm",
  label,
  className,
  ...rest
}: SyntexProgressProps) {
  const pct = clampProgress(value);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-full",
        size === "sm" ? "h-1.5" : "h-2",
        dark ? "bg-track-dark" : "bg-track",
        className,
      )}
      {...rest}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-200 ease-out", FILL[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
