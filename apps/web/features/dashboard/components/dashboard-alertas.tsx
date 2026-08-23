import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { DEMO_ALERTAS } from "@/features/dashboard/demo-painel";

/**
 * Atenção necessária — frentes que pedem decisão.
 * Dados: DEV-only (`demo-painel.ts`).
 */
export function DashboardAlertas() {
  return (
    <DashboardPanel
      title="Atenção necessária"
      subtitle="4 frentes exigem decisão hoje"
      variant="attention"
      rail="amber"
      className="rounded-feature"
      action={
        <Link
          href="/cobrancas"
          className="inline-flex items-center rounded-control px-3 py-1.5 text-label font-semibold text-ink ring-1 ring-inset ring-border transition-colors hover:bg-surface-2"
        >
          Abrir fila
        </Link>
      }
    >
      <ul className="grid gap-px bg-border/60 sm:grid-cols-2">
        {DEMO_ALERTAS.map((a) => {
          const inner = (
            <>
              <span
                className={cn(
                  "mt-1 size-2 shrink-0 rounded-full",
                  a.tone === "critical" ? "bg-danger" : "bg-warning",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-dense font-bold text-ink">{a.title}</span>
                <span className="font-mono text-label text-ink-3">{a.meta}</span>
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </>
          );

          return (
            <li key={a.title} className="bg-surface">
              {a.href ? (
                <Link
                  href={a.href}
                  className="group flex items-start gap-3 p-4 transition-colors hover:bg-tint-amber/40"
                >
                  {inner}
                </Link>
              ) : (
                <div className="group flex items-start gap-3 p-4">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </DashboardPanel>
  );
}
