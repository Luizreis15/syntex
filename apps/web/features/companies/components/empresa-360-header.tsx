import Link from "next/link";
import { Building2, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { formatCnpj } from "@/lib/formatters/cnpj";
import { SyntexStatus, type DomainState } from "@/components/ui/syntex-status";
import { cn } from "@/lib/utils";
import type { SummaryItem } from "@/features/companies/empresa-360-data";

const TONE_BAR: Record<SummaryItem["tone"], string> = {
  syntex: "bg-petrol-600",
  ok: "bg-success",
  critical: "bg-danger",
  amber: "bg-warning",
  teal: "bg-teal",
};

const TONE_TEXT: Record<SummaryItem["tone"], string> = {
  syntex: "text-petrol-600",
  ok: "text-success",
  critical: "text-danger",
  amber: "text-warning",
  teal: "text-teal",
};

export interface Empresa360HeaderProps {
  companyId: string;
  name: string;
  legalName: string | null;
  cnpj: string;
  cityLabel: string | null;
  cnaeLabel: string | null;
  establishmentCount: number;
  domainStatus: DomainState | null;
  summary: SummaryItem[];
}

export function Empresa360Header({
  companyId,
  name,
  legalName,
  cnpj,
  cityLabel,
  cnaeLabel,
  establishmentCount,
  domainStatus,
  summary,
}: Empresa360HeaderProps) {
  return (
    <section className="surface-identity relative overflow-hidden">
      <div className="hairline-grid-light pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative px-6 pt-6 xl:px-8">
        <nav className="flex items-center gap-2 font-mono text-label text-ink-3">
          <Link href="/painel" className="hover:text-ink">
            Painel
          </Link>
          <span>/</span>
          <Link href="/empresas" className="hover:text-ink">
            Empresas
          </Link>
          <span>/</span>
          <span className="text-petrol-600">{formatCnpj(cnpj)}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="surface-command flex size-12 items-center justify-center rounded-control">
              <Building2 className="size-5 text-teal" aria-hidden />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[1.7rem] leading-none font-black tracking-[-0.035em] text-ink">
                  {name}
                </h1>
                {domainStatus ? (
                  <SyntexStatus
                    kind="domain"
                    state={domainStatus}
                    label={
                      domainStatus === "disputada"
                        ? "Representação disputada"
                        : undefined
                    }
                  />
                ) : null}
              </div>
              {legalName && legalName !== name ? (
                <p className="mt-1.5 text-sm font-medium text-ink-2">{legalName}</p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-mono text-label text-ink-3">CNPJ {formatCnpj(cnpj)}</span>
                {cityLabel ? (
                  <span className="text-xs font-semibold text-ink-2">Matriz · {cityLabel}</span>
                ) : null}
                {cnaeLabel ? (
                  <span className="font-mono text-label text-ink-3">CNAE {cnaeLabel}</span>
                ) : null}
                <span className="text-xs font-semibold text-ink-2">
                  {establishmentCount} estabelecimento{establishmentCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/empresas/${companyId}`}
              className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-label font-bold text-ink transition-colors hover:bg-surface-2"
            >
              <Pencil className="size-3.5" aria-hidden /> Editar
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-control bg-petrol-600 px-3 py-2 text-label font-bold text-shell-ink transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" aria-hidden /> Nova tarefa
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-control px-2 py-2 text-ink-3 hover:text-ink"
              aria-label="Mais ações"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {summary.map((s) => (
            <div key={s.label} className="pr-5">
              <div className="flex items-center gap-2">
                <span className={cn("h-3 w-[3px] rounded-full", TONE_BAR[s.tone])} aria-hidden />
                <span className="text-label font-bold uppercase tracking-[0.12em] text-ink-3">
                  {s.label}
                </span>
              </div>
              <p className={cn("mt-1 font-mono text-lg font-black tabular-nums", TONE_TEXT[s.tone])}>
                {s.value}
              </p>
              <p className="font-mono text-label text-ink-3">{s.hint}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 h-px bg-border/60" />
      </div>
    </section>
  );
}
