import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SyntexAccentTone = "teal" | "blue" | "green" | "amber" | "red";

const RAIL_BG: Record<SyntexAccentTone, string> = {
  teal: "bg-rail-teal",
  blue: "bg-rail-blue",
  green: "bg-rail-green",
  amber: "bg-rail-amber",
  red: "bg-rail-red",
};

export interface SyntexAccentRailProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: SyntexAccentTone;
  /** `start` = lateral esquerda; `top` = faixa superior. */
  placement?: "start" | "top";
}

/**
 * Indicador fino de prioridade / atenção / métrica.
 * Discreto — nunca glow.
 */
export function SyntexAccentRail({
  tone = "teal",
  placement = "start",
  className,
  ...rest
}: SyntexAccentRailProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full",
        placement === "start" && "bottom-2 left-0 top-2 w-0.5",
        placement === "top" && "left-2 right-2 top-0 h-0.5",
        RAIL_BG[tone],
        className,
      )}
      {...rest}
    />
  );
}

/** Wrapper relativo que posiciona o rail. */
export function SyntexAccentFrame({
  tone = "teal",
  placement = "start",
  className,
  children,
}: {
  tone?: SyntexAccentTone;
  placement?: "start" | "top";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      <SyntexAccentRail tone={tone} placement={placement} />
      {children}
    </div>
  );
}
