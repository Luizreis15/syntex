import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SyntexAccentRail,
  type SyntexAccentTone,
} from "@/components/ui/syntex-accent-rail";

export type SyntexPanelVariant = "standard" | "raised" | "inset" | "dark" | "attention";

export interface SyntexPanelProps extends HTMLAttributes<HTMLElement> {
  variant?: SyntexPanelVariant;
  /** Rail semântico opcional (atenção / operação). */
  rail?: SyntexAccentTone;
  children: ReactNode;
}

const VARIANT: Record<SyntexPanelVariant, string> = {
  standard: "rounded-panel border border-border/60 bg-surface shadow-surface",
  raised: "surface-raised",
  inset: "surface-inset border border-border/40",
  dark: "surface-dark",
  attention: "rounded-panel border border-border/50 bg-tint-amber shadow-surface",
};

/**
 * Painel oficial Syntex v2.1.
 * Prefira composição PanelHeader / PanelBody a inventar cards locais.
 */
export function SyntexPanel({
  variant = "standard",
  rail,
  className,
  children,
  ...rest
}: SyntexPanelProps) {
  return (
    <section className={cn("relative overflow-hidden", VARIANT[variant], className)} {...rest}>
      {rail ? <SyntexAccentRail tone={rail} placement="start" /> : null}
      {children}
    </section>
  );
}

export function SyntexPanelHeader({
  className,
  density = "default",
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { density?: "default" | "compact" }) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        density === "compact" ? "px-3 py-2" : "border-b border-border/40 px-5 py-3",
        className,
      )}
      {...rest}
    >
      {children}
    </header>
  );
}

/** Header em painel dark — divisores shell. */
export function SyntexPanelHeaderDark({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-shell-border/50 px-3.5 py-2.5",
        className,
      )}
      {...rest}
    >
      {children}
    </header>
  );
}

export function SyntexPanelTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-component font-semibold tracking-tight text-ink", className)} {...rest}>
      {children}
    </h2>
  );
}

export function SyntexPanelDescription({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-0.5 text-label font-normal text-ink-3", className)} {...rest}>
      {children}
    </p>
  );
}

export function SyntexPanelBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...rest}>
      {children}
    </div>
  );
}

export function SyntexPanelFooter({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn("flex flex-wrap items-center gap-2 border-t border-border/40 px-5 py-2.5", className)}
      {...rest}
    >
      {children}
    </footer>
  );
}
