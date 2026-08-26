import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * C4 — honesty: marca visual de bloco ilustrativo (DEV_DEMO).
 * Não substitui seed REAL; só evita confundir DEMO com operação.
 */
export function DevDemoBadge({
  className,
  tone = "default",
}: {
  className?: string;
  /** `onDark` = hero / command surfaces */
  tone?: "default" | "onDark";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-control px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.08em]",
        tone === "onDark"
          ? "bg-shell-ink/[0.12] text-shell-ink-2/90 ring-1 ring-inset ring-shell-ink/[0.1]"
          : "bg-surface-2 text-ink-3 ring-1 ring-inset ring-border",
        className,
      )}
      title="Conteúdo ilustrativo — não é dado operacional"
    >
      DEMO
    </span>
  );
}

/** Faixa curta no topo de páginas que misturam REAL + DEMO. */
export function DevDemoNotice({
  className,
  children = "Alguns blocos nesta página são ilustrativos (DEMO) e não representam operação real. Use Empresas, Representação, Convenções e Cobranças para o ciclo operacional.",
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <p
      role="note"
      className={cn(
        "rounded-control border border-border/80 bg-surface-2/80 px-3.5 py-2.5 text-dense text-ink-2",
        className,
      )}
    >
      <span className="mr-2 inline-flex align-middle">
        <DevDemoBadge />
      </span>
      {children}
    </p>
  );
}
