import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DashboardPanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  density?: "default" | "compact";
}

/** Painel claro — superfície branca, borda/sombra mínimas (Fase 2.4). */
export function DashboardPanel({
  title,
  subtitle,
  action,
  children,
  className,
  density = "default",
}: DashboardPanelProps) {
  const compact = density === "compact";

  return (
    <section
      className={cn(
        "rounded-md border border-border/40 bg-surface shadow-sm",
        className,
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-2",
          compact ? "px-3 py-2" : "border-b border-border/40 px-5 py-2.5",
        )}
      >
        <div>
          <h2
            className={cn(
              "tracking-tight text-ink",
              compact ? "text-dense font-semibold" : "text-component font-bold",
            )}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-label font-normal text-ink-3/75">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
