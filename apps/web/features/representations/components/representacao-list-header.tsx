import Link from "next/link";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInteiro } from "@/features/dashboard/format";
import type { RepresentationStatusKey, RepresentationStatusSummary } from "@/features/representations/data";

const STATUS_STRIP: {
  key: RepresentationStatusKey | "total";
  label: string;
  tone: string;
  bar: string;
  param: string | null;
}[] = [
  { key: "total", label: "Estabelecimentos", tone: "text-ink", bar: "bg-petrol-600", param: null },
  {
    key: "reconhecida",
    label: "Ativos",
    tone: "text-status-reconhecida",
    bar: "bg-status-reconhecida",
    param: "reconhecida",
  },
  {
    key: "reivindicada",
    label: "Pendentes",
    tone: "text-status-reivindicada",
    bar: "bg-status-reivindicada",
    param: "reivindicada",
  },
  {
    key: "disputada",
    label: "Em disputa",
    tone: "text-status-disputada",
    bar: "bg-status-disputada",
    param: "disputada",
  },
  {
    key: "perdida",
    label: "Inativos",
    tone: "text-status-perdida",
    bar: "bg-status-perdida",
    param: "perdida",
  },
  {
    key: "sem_representacao",
    label: "Sem representação",
    tone: "text-ink-2",
    bar: "bg-ink-3",
    param: "sem_representacao",
  },
];

export function RepresentacaoListHeader({
  summary,
  activeStatus,
}: {
  summary: RepresentationStatusSummary;
  activeStatus: string | null;
}) {
  return (
    <section className="surface-identity relative overflow-hidden border-b border-border/60">
      <div className="hairline-grid-light pointer-events-none absolute inset-0 opacity-25" />
      <div className="relative px-6 pb-5 pt-6 xl:px-8">
        <nav className="flex items-center gap-2 font-mono text-label text-ink-3">
          <Link href="/painel" className="hover:text-ink">
            Painel
          </Link>
          <span>/</span>
          <span className="text-petrol-600">Representação</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="surface-command flex size-11 items-center justify-center rounded-control">
              <Scale className="size-5 text-teal" aria-hidden />
            </span>
            <div>
              <h1 className="text-[1.55rem] leading-none font-black tracking-[-0.03em] text-ink">
                Representação
              </h1>
              <p className="mt-2 text-sm font-semibold text-ink-2">
                Enquadramento sindical por estabelecimento
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STATUS_STRIP.map((item) => {
            const value = item.key === "total" ? summary.total : summary.byStatus[item.key];
            const href =
              item.param === null
                ? "/representacao"
                : `/representacao?status=${encodeURIComponent(item.param)}`;
            const active =
              item.param === null ? !activeStatus : activeStatus === item.param;

            return (
              <Link
                key={item.key}
                href={href}
                className={cn(
                  "rounded-panel border px-3.5 py-3 transition-colors",
                  active
                    ? "border-petrol-600/35 bg-tint-blue"
                    : "border-border/50 bg-surface/70 hover:bg-surface",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("h-3 w-[3px] rounded-full", item.bar)} aria-hidden />
                  <span className="text-label font-bold uppercase tracking-[0.1em] text-ink-3">
                    {item.label}
                  </span>
                </div>
                <p className={cn("mt-1.5 font-mono text-xl font-black tabular-nums", item.tone)}>
                  {formatInteiro(value)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
