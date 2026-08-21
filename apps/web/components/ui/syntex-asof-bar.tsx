"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { IconCalendar, IconChevronDown } from "./icons";
import { formatData } from "@/lib/formatters/data";

const PARAM = "em";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Moldura permanente do chrome (design/SYNTEX-UI.md §0, item 2) — nunca
 * implementada até este redesign. Tudo que a tela mostra abaixo desta barra
 * é o que valia na data escolhida; por isso ela não fica num menu, fica
 * sempre visível entre o topbar e o conteúdo, em toda rota do shell.
 *
 * A data vive em `?em=` — estado de URL, não de componente — para que toda
 * página do shell possa ler `searchParams.em` e resolver vigência sem um
 * segundo mecanismo de estado global.
 */
export function SyntexAsOfBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const em = searchParams.get(PARAM);
  const isToday = !em || em === todayISO();

  function setEm(next: string | null) {
    const params = new URLSearchParams(searchParams);
    if (!next || next === todayISO()) {
      params.delete(PARAM);
    } else {
      params.set(PARAM, next);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setOpen(false);
  }

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-surface-2 px-6">
      <IconCalendar size={14} className="text-ink-3" />
      <span className="text-label uppercase text-ink-3">Vigência em</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 rounded-xs px-1.5 py-0.5 font-mono text-label font-semibold text-ink hover:bg-surface"
          >
            {isToday ? "Hoje" : formatData(em!)}
            <IconChevronDown size={11} className="text-ink-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          <div className="flex flex-col gap-3">
            <p className="text-label text-ink-3">
              Toda entidade nesta tela é mostrada como valia nesta data.
            </p>
            <input
              type="date"
              autoFocus
              defaultValue={em ?? todayISO()}
              max={todayISO()}
              onChange={(e) => setEm(e.target.value)}
              className="h-input w-full rounded-sm border border-border bg-surface px-2.5 font-mono text-body text-ink outline-none focus-visible:border-petrol-600"
            />
            {!isToday && (
              <button
                type="button"
                onClick={() => setEm(null)}
                className="text-left text-label text-petrol-700 hover:text-petrol-800"
              >
                Voltar para hoje
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
