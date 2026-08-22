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

export function DashboardOperationNow({ items }: { items: OperationPulseItem[] }) {
  return (
    <DashboardPanel
      title="Pulso da operação"
      subtitle="Indicadores com fonte real no Syntex"
      action={<span className="live-dot mt-1.5 size-2 rounded-full bg-teal" aria-hidden />}
    >
      {items.length === 0 ? (
        <p className="px-5 py-10 text-body text-ink-2">
          Ainda não há indicadores operacionais disponíveis para o seu perfil.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const row = (
              <>
                <span className={cn("h-8 w-[3px] shrink-0 rounded-full", TONE_BAR[item.tone])} />
                <span className="min-w-0 flex-1">
                  <span className="block text-dense font-bold text-ink">{item.label}</span>
                  <span className="font-mono text-label text-ink-3">{item.hint}</span>
                </span>
                <span className="font-mono text-page-title font-black text-ink">{item.value}</span>
              </>
            );

            return (
              <li key={item.key}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-2"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-3">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
