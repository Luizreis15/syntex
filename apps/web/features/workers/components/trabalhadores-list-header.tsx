import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInteiro } from "@/features/dashboard/format";
import type { WorkersStatusSummary } from "@/features/workers/data";

/**
 * Header + faixa de métricas — mesma família visual de /empresas (P2.1).
 */
export function TrabalhadoresListHeader({
  summary,
  canCreate,
}: {
  summary: WorkersStatusSummary;
  canCreate: boolean;
}) {
  const items = [
    {
      key: "total",
      label: "Na base",
      value: summary.total,
      valueTone: "text-petrol-600",
      rail: "bg-petrol-600",
      tint: "bg-tint-blue",
    },
    {
      key: "assoc",
      label: "Associados",
      value: summary.associados,
      valueTone: "text-success",
      rail: "bg-success",
      tint: "bg-tint-green",
    },
    {
      key: "sem",
      label: "Sem filiação",
      value: summary.semFiliação,
      valueTone: "text-warning",
      rail: "bg-warning",
      tint: "bg-tint-amber",
    },
  ];

  return (
    <section className="surface-identity relative overflow-hidden border-b border-border/50">
      <div className="hairline-grid-light pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative px-6 pb-5 pt-5 xl:px-8">
        <nav className="flex items-center gap-2 font-mono text-label text-ink-3">
          <Link href="/painel" className="hover:text-ink">
            Painel
          </Link>
          <span>/</span>
          <span className="text-petrol-600">Trabalhadores</span>
        </nav>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="surface-command flex size-10 shrink-0 items-center justify-center rounded-control">
              <Users className="size-5 text-teal" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-page-title font-semibold tracking-[-0.03em] text-ink">
                Trabalhadores
              </h1>
              <p className="mt-1 text-dense font-medium text-ink-2">
                Base de pessoas · vínculos e filiação sindical
              </p>
            </div>
          </div>
          {canCreate ? (
            <Link
              href="/trabalhadores/novo"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control bg-petrol-700 px-3 text-dense font-semibold text-shell-ink transition-colors hover:bg-petrol-600"
            >
              <Plus className="size-3.5" aria-hidden /> Novo trabalhador
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.key}
              className={cn(
                "relative flex h-[72px] flex-col justify-center overflow-hidden rounded-panel px-3.5 py-3 ring-1 ring-inset ring-border/40",
                item.tint,
              )}
            >
              <span
                className={cn("absolute bottom-2.5 left-0 top-2.5 w-0.5 rounded-full", item.rail)}
                aria-hidden
              />
              <div className="pl-2.5">
                <span className="text-label font-semibold uppercase tracking-[0.1em] text-ink-3">
                  {item.label}
                </span>
                <p
                  className={cn(
                    "mt-1 text-metric-sm font-semibold tracking-[-0.02em] tabular-nums",
                    item.valueTone,
                  )}
                >
                  {formatInteiro(item.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
