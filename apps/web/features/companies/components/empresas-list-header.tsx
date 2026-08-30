import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInteiro } from "@/features/dashboard/format";
import type { CompaniesStatusSummary, CompanyStatusKey } from "@/features/companies/data";

const STATUS_STRIP: {
  key: CompanyStatusKey | "total";
  label: string;
  tone: string;
  bar: string;
  param: string | null;
}[] = [
  { key: "total", label: "Na base", tone: "text-ink", bar: "bg-petrol-600", param: null },
  {
    key: "reconhecida",
    label: "Ativas",
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
    label: "Inativas",
    tone: "text-status-perdida",
    bar: "bg-status-perdida",
    param: "perdida",
  },
];

export function EmpresasListHeader({
  summary,
  activeStatus,
  canCreate,
}: {
  summary: CompaniesStatusSummary;
  activeStatus: string | null;
  canCreate: boolean;
}) {
  return (
    <section className="surface-identity relative overflow-hidden border-b border-border/60">
      <div className="hairline-grid-light pointer-events-none absolute inset-0 opacity-25" />
      <div className="relative px-6 pt-6 pb-5 xl:px-8">
        <nav className="flex items-center gap-2 font-mono text-label text-ink-3">
          <Link href="/painel" className="hover:text-ink">
            Painel
          </Link>
          <span>/</span>
          <span className="text-petrol-600">Empresas</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="surface-command flex size-11 items-center justify-center rounded-control">
              <Building2 className="size-5 text-teal" aria-hidden />
            </span>
            <div>
              <h1 className="text-[1.55rem] leading-none font-black tracking-[-0.03em] text-ink">
                Empresas
              </h1>
              <p className="mt-2 text-sm font-semibold text-ink-2">
                Base sindical · representação e vigência na competência atual
              </p>
            </div>
          </div>
          {canCreate ? (
            <Link
              href="/empresas/nova"
              className="inline-flex h-10 items-center gap-1.5 rounded-control bg-petrol-700 px-3.5 text-label font-bold text-shell-ink transition-colors hover:bg-petrol-600"
            >
              <Plus className="size-3.5" aria-hidden /> Nova empresa
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_STRIP.map((item) => {
            const value =
              item.key === "total" ? summary.total : summary.byStatus[item.key];
            const href =
              item.param === null
                ? "/empresas"
                : `/empresas?status=${encodeURIComponent(item.param)}`;
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
