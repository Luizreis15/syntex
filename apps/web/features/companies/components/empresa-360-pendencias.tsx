import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatData } from "@/lib/formatters/data";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { DEMO_EMPRESA_PENDENCIAS_EXTRA } from "@/features/companies/demo-empresa-360";

const TONE_DOT = {
  critical: "bg-danger",
  amber: "bg-warning",
  syntex: "bg-petrol-600",
} as const;

export function Empresa360Pendencias({
  charges,
}: {
  charges: { id: string; amount: number; status: string; dueDate: string }[];
}) {
  const chargeItems = charges.slice(0, 3).map((c) => ({
    key: c.id,
    href: `/cobrancas/${c.id}`,
    title:
      c.status === "vencido"
        ? `Boleto vencido · ${formatData(c.dueDate)}`
        : `Boleto pendente · venc. ${formatData(c.dueDate)}`,
    meta: formatMoeda(c.amount),
    tone: (c.status === "vencido" ? "critical" : "amber") as keyof typeof TONE_DOT,
  }));

  const items =
    chargeItems.length > 0
      ? [
          ...chargeItems,
          ...DEMO_EMPRESA_PENDENCIAS_EXTRA.slice(0, Math.max(0, 3 - chargeItems.length)).map(
            (p, i) => ({
              key: `demo-${i}`,
              href: undefined as string | undefined,
              title: p.title,
              meta: `${p.meta} · demo`,
              tone: p.tone,
            }),
          ),
        ]
      : DEMO_EMPRESA_PENDENCIAS_EXTRA.map((p, i) => ({
          key: `demo-${i}`,
          href: undefined as string | undefined,
          title: p.title,
          meta: `${p.meta} · demo`,
          tone: p.tone,
        }));

  return (
    <DashboardPanel
      title="Pendências"
      subtitle={`${items.length} itens em aberto`}
      variant="attention"
      rail="red"
    >
      <ul className="divide-y divide-border/55">
        {items.map((p) => {
          const body = (
            <>
              <span className={cn("mt-1.5 size-2 rounded-full", TONE_DOT[p.tone])} aria-hidden />
              <span>
                <span className="block text-dense font-bold text-ink">{p.title}</span>
                <span className="font-mono text-label text-ink-3">{p.meta}</span>
              </span>
            </>
          );
          return (
            <li key={p.key}>
              {p.href ? (
                <Link href={p.href} className="flex items-start gap-3 px-5 py-3 hover:bg-surface-2">
                  {body}
                </Link>
              ) : (
                <div className="flex items-start gap-3 px-5 py-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </DashboardPanel>
  );
}
