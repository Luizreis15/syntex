import Link from "next/link";
import { cn } from "@/lib/utils";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import type { OperationPulseItem } from "@/features/dashboard/compose";

const TONE_BAR: Record<OperationPulseItem["tone"], string> = {
  info: "bg-petrol-600",
  warning: "bg-warning",
  success: "bg-success",
  danger: "bg-danger",
};

/**
 * Operação agora — unidades operacionais (não tabela).
 * Itens: DEV-only (`demo-painel.ts`).
 */
export function DashboardOperationNow({ items }: { items: OperationPulseItem[] }) {
  return (
    <DashboardPanel
      title="Operação agora"
      subtitle="Syntex Pulse · ilustrativo (não é fila real)"
      demo
      variant="raised"
      rail="teal"
      className="rounded-feature"
      action={<span className="live-dot mt-1.5 size-2 rounded-full bg-teal" aria-hidden />}
    >
      {items.length === 0 ? (
        <p className="px-5 py-10 text-body text-ink-2">
          Ainda não há indicadores operacionais disponíveis para o seu perfil.
        </p>
      ) : (
        <ul className="px-2 py-1.5">
          {items.map((item) => {
            const row = (
              <>
                <span
                  className={cn("mt-0.5 h-9 w-[3px] shrink-0 rounded-full", TONE_BAR[item.tone])}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 py-0.5">
                  <span className="block text-dense font-semibold text-ink">{item.label}</span>
                  <span className="font-mono text-label text-ink-3">{item.hint}</span>
                </span>
                <span className="text-[1.65rem] leading-none font-semibold tracking-[-0.03em] tabular-nums text-ink">
                  {item.value}
                </span>
              </>
            );

            const className =
              "flex items-center gap-3.5 rounded-control px-3 py-2.5 transition-colors";

            return (
              <li key={item.key}>
                {item.href ? (
                  <Link href={item.href} className={cn(className, "hover:bg-surface-2/80")}>
                    {row}
                  </Link>
                ) : (
                  <div className={cn(className, "hover:bg-surface-2/50")}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
