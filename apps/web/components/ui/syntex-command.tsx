"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQuery } from "@tanstack/react-query";
import { IconBuilding, IconSearch } from "./icons";

interface SearchResult {
  companies: { id: string; label: string; sublabel: string }[];
  establishments: { id: string; companyId: string; label: string; sublabel: string }[];
}

const EMPTY_RESULT: SearchResult = { companies: [], establishments: [] };

/**
 * ⌘K — busca real, agrupada por tipo, nunca retorna algo que o usuário não
 * abriria pela navegação (design/SYNTEX-UI.md, prompt 02 §24). A permissão
 * é decidida no servidor (/api/search); aqui só se renderiza o que voltou.
 */
export function SyntexCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", query],
    queryFn: async (): Promise<SearchResult> => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return EMPTY_RESULT;
      return res.json();
    },
    enabled: open && query.trim().length >= 2,
    placeholderData: (previous) => previous,
  });

  const results = data ?? EMPTY_RESULT;

  const goTo = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-input w-full max-w-md items-center gap-2 rounded-sm border border-border bg-surface px-3 text-body text-ink-3 hover:border-border-strong"
      >
        <IconSearch size={16} />
        <span className="flex-1 text-left">Buscar empresa, CNPJ, estabelecimento…</span>
        <kbd className="rounded-xs border border-border px-1.5 py-0.5 font-mono text-label text-ink-3">⌘K</kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Busca global"
        contentClassName="fixed left-1/2 top-24 z-command w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-md border border-border bg-surface shadow-elevated"
        overlayClassName="fixed inset-0 z-command bg-overlay"
        shouldFilter={false}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <IconSearch size={16} className="text-ink-3" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar trabalhador, empresa, CPF, CNPJ, protocolo…"
            className="h-input w-full bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
          />
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-1">
          {query.trim().length < 2 && (
            <p className="px-3 py-6 text-center text-body text-ink-3">Digite ao menos 2 caracteres.</p>
          )}

          {query.trim().length >= 2 && !isFetching && results.companies.length === 0 && results.establishments.length === 0 && (
            <Command.Empty className="px-3 py-6 text-center text-body text-ink-3">
              Nada encontrado para “{query}”.
            </Command.Empty>
          )}

          {results.companies.length > 0 && (
            <Command.Group heading="Empresas" className="px-2 py-1 text-label uppercase text-ink-3">
              {results.companies.map((company) => (
                <Command.Item
                  key={company.id}
                  value={`company-${company.id}`}
                  onSelect={() => goTo(`/empresas/${company.id}`)}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-body text-ink aria-selected:bg-petrol-100"
                >
                  <IconBuilding size={16} className="text-ink-3" />
                  <span className="flex-1">{company.label}</span>
                  <span className="font-mono text-label text-ink-3">{company.sublabel}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {results.establishments.length > 0 && (
            <Command.Group heading="Estabelecimentos" className="px-2 py-1 text-label uppercase text-ink-3">
              {results.establishments.map((establishment) => (
                <Command.Item
                  key={establishment.id}
                  value={`establishment-${establishment.id}`}
                  onSelect={() => goTo(`/empresas/${establishment.companyId}`)}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-body text-ink aria-selected:bg-petrol-100"
                >
                  <IconBuilding size={16} className="text-ink-3" />
                  <span className="flex-1">{establishment.label}</span>
                  <span className="font-mono text-label text-ink-3">{establishment.sublabel}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
