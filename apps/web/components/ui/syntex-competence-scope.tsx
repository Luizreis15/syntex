"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const PARAM = "competencia";

function currentCompetence(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatCompetence(value: string): string {
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${month}/${year}`;
}

/**
 * Substitui a faixa "Vigência em" (banda full-width) pelo padrão da
 * referência aprovada: um pill compacto na topbar, em competência
 * (mês/ano) — vocabulário de folha/sindicato, não data exata. Mesmo
 * mecanismo de estado (URL, `?competencia=`), só a composição visual e o
 * grão temporal mudaram. Nenhuma tela ainda lê este parâmetro — ver
 * relatório de dívida técnica.
 */
export function SyntexCompetenceScope() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const value = searchParams.get(PARAM);
  const isCurrent = !value || value === currentCompetence();

  function setCompetence(next: string | null) {
    const params = new URLSearchParams(searchParams);
    if (!next || next === currentCompetence()) {
      params.delete(PARAM);
    } else {
      params.set(PARAM, next);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="hidden items-center gap-2 rounded-sm border border-border px-2.5 py-2 text-label font-bold text-ink hover:bg-surface-2 md:inline-flex"
        >
          <span className="text-label uppercase tracking-wide text-ink-3">Competência</span>
          <span className="font-mono text-body text-ink">
            {isCurrent ? formatCompetence(currentCompetence()) : formatCompetence(value!)}
          </span>
          <ChevronDown size={14} className="text-ink-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="flex flex-col gap-3">
          <p className="text-label text-ink-3">Toda entidade é mostrada como valia nesta competência.</p>
          <input
            type="month"
            autoFocus
            defaultValue={value ?? currentCompetence()}
            max={currentCompetence()}
            onChange={(e) => setCompetence(e.target.value)}
            className="h-input w-full rounded-sm border border-border bg-surface px-2.5 font-mono text-body text-ink outline-none focus-visible:border-petrol-600"
          />
          {!isCurrent && (
            <button
              type="button"
              onClick={() => setCompetence(null)}
              className="text-left text-label text-petrol-700 hover:text-petrol-800"
            >
              Voltar para a competência atual
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
