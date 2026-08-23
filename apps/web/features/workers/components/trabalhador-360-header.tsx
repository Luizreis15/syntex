import Link from "next/link";
import { CalendarDays, MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCpfMasked } from "@/lib/formatters/cpf";
import type { TrabalhadorSummaryItem } from "@/features/workers/trabalhador-360-compose";

const TONE_BAR: Record<TrabalhadorSummaryItem["tone"], string> = {
  ok: "bg-success",
  syntex: "bg-petrol-600",
  teal: "bg-teal",
  amber: "bg-warning",
  critical: "bg-danger",
};

const TONE_TEXT: Record<TrabalhadorSummaryItem["tone"], string> = {
  ok: "text-success",
  syntex: "text-petrol-600",
  teal: "text-teal",
  amber: "text-warning",
  critical: "text-danger",
};

export function Trabalhador360Header({
  name,
  cpf,
  registrationNumber,
  jobTitle,
  companyName,
  companyId,
  branchLabel,
  associadoAtivo,
  initials,
  summary,
}: {
  name: string;
  cpf: string;
  registrationNumber: string | null;
  jobTitle: string | null;
  companyName: string | null;
  companyId: string | null;
  branchLabel: string | null;
  associadoAtivo: boolean;
  initials: string;
  summary: TrabalhadorSummaryItem[];
}) {
  return (
    <section className="surface-identity relative overflow-hidden">
      <div className="hairline-grid-light pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative px-6 pt-6 xl:px-8">
        <nav className="flex items-center gap-2 font-mono text-label text-ink-3">
          <Link href="/painel" className="hover:text-ink">
            Painel
          </Link>
          <span>/</span>
          <Link href="/trabalhadores" className="hover:text-ink">
            Trabalhadores
          </Link>
          <span>/</span>
          <span className="text-petrol-600">CPF {formatCpfMasked(cpf)}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex size-12 items-center justify-center rounded-control bg-petrol-600 text-base font-black text-shell-ink">
              {initials}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[1.7rem] leading-none font-black tracking-[-0.035em] text-ink">
                  {name}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-label font-bold tracking-wide",
                    associadoAtivo
                      ? "bg-tint-green text-success"
                      : "bg-surface-2 text-ink-2",
                  )}
                >
                  <i
                    className={cn(
                      "size-1.5 rounded-full",
                      associadoAtivo ? "bg-success" : "bg-ink-3",
                    )}
                    aria-hidden
                  />
                  {associadoAtivo ? "Associado ativo" : "Sem filiação ativa"}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-mono text-label text-ink-3">CPF {formatCpfMasked(cpf)}</span>
                {registrationNumber ? (
                  <span className="font-mono text-label text-ink-3">MAT. {registrationNumber}</span>
                ) : null}
                {(jobTitle || companyName) && (
                  <span className="text-xs font-semibold text-ink-2">
                    {[jobTitle, companyName].filter(Boolean).join(" · ")}
                    {companyId ? (
                      <>
                        {" · "}
                        <Link href={`/empresas/${companyId}`} className="text-petrol-600 hover:underline">
                          abrir empresa
                        </Link>
                      </>
                    ) : null}
                  </span>
                )}
                {branchLabel ? (
                  <span className="text-xs font-semibold text-ink-2">{branchLabel}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-label font-bold text-ink transition-colors hover:bg-surface-2"
            >
              <MessageSquare className="size-3.5" aria-hidden /> Conversar
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-label font-bold text-ink transition-colors hover:bg-surface-2"
            >
              <CalendarDays className="size-3.5" aria-hidden /> Agendar
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-control bg-petrol-600 px-3 py-2 text-label font-bold text-shell-ink transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" aria-hidden /> Novo atendimento
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
