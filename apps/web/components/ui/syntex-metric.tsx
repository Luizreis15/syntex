import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SyntexMetricProps {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "danger";
  className?: string;
}

const TONE_VALUE: Record<NonNullable<SyntexMetricProps["tone"]>, string> = {
  default: "text-ink",
  warning: "text-warning",
  danger: "text-danger",
};

/**
 * Unidade atômica de número no painel — nunca um card por métrica
 * (design/SYNTEX-UI.md §7). Quem monta a tela agrupa `SyntexMetric` numa
 * barra com divisores (`divide-x`), não numa grade de cards; o componente
 * não impõe moldura própria por isso.
 */
export function SyntexMetric({ label, value, hint, href, tone = "default", className }: SyntexMetricProps) {
  const valueNode = (
    <span className={cn("font-mono text-page-title font-semibold", TONE_VALUE[tone])}>{value}</span>
  );

  return (
    <div className={cn("flex flex-col gap-1 px-5 py-4 first:pl-0 last:pr-0", className)}>
      <span className="text-label uppercase text-ink-3">{label}</span>
      {href ? (
        <Link href={href} className="w-fit transition-colors hover:text-petrol-700">
          {valueNode}
        </Link>
      ) : (
        valueNode
      )}
      {hint ? <span className="text-label text-ink-3">{hint}</span> : null}
    </div>
  );
}

/** Barra de métricas com divisores — a alternativa do §7 ao card-grid. */
export function SyntexMetricBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap divide-x divide-border rounded-sm border border-border bg-surface", className)}>
      {children}
    </div>
  );
}
