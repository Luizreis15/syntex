"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { SyntexDataTable } from "@/components/ui/syntex-data-table";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { SyntexSelect } from "@/components/ui/syntex-select";
import { companyColumns } from "./columns";
import type { CompaniesPage } from "./data";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "reconhecida", label: "Reconhecida" },
  { value: "reivindicada", label: "Reivindicada" },
  { value: "disputada", label: "Disputada" },
  { value: "perdida", label: "Perdida" },
  { value: "sem_representacao", label: "Sem representação" },
];

export interface CompaniesTableProps {
  page: CompaniesPage;
  pageIndex: number;
  q: string;
}

/**
 * Listagem Empresas — Modo A: painel raised + toolbar densificado.
 * Filtro continua na URL.
 */
export function CompaniesTable({ page, pageIndex, q }: CompaniesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(q);
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      if (!("page" in patch)) params.delete("page");
      startTransition(() => router.push(`/empresas?${params.toString()}`));
    },
    [router, searchParams],
  );

  return (
    <div className="surface-raised overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/50 px-4 py-3">
        <form
          className="flex min-w-56 flex-1 items-center gap-2 rounded-control border border-border bg-paper px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ q: search || null });
          }}
        >
          <Search className="size-3.5 shrink-0 text-ink-3" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar empresas, CNPJ, município…"
            className="w-full bg-transparent text-dense font-medium text-ink outline-none placeholder:text-ink-3"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-label font-bold text-ink-3">
            <Filter className="size-3.5" aria-hidden /> Filtros
          </span>
          <SyntexSelect
            aria-label="Filtrar por município"
            value={searchParams.get("municipio") ?? ""}
            onValueChange={(value) => updateParams({ municipio: value || null })}
            options={[
              { value: "", label: "Todos os municípios" },
              ...page.municipalityOptions.map((m) => ({ value: m.slug, label: m.name })),
            ]}
          />
          <SyntexSelect
            aria-label="Filtrar por status de representação"
            value={searchParams.get("status") ?? ""}
            onValueChange={(value) => updateParams({ status: value || null })}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className="px-4 py-3">
        <SyntexDataTable
          aria-label="Empresas"
          columns={companyColumns}
          data={page.rows}
          getRowId={(row) => row.id}
          isLoading={isPending}
          enableRowSelection
          density="compact"
          bare
          pagination={{
            pageIndex,
            pageSize: PAGE_SIZE,
            rowCount: page.rowCount,
            onPageChange: (nextIndex) => updateParams({ page: String(nextIndex + 1) }),
          }}
          emptyState={
            <SyntexEmptyState
              title="Nenhuma empresa encontrada"
              description="Ajuste a busca ou os filtros — ou cadastre a primeira empresa desta unidade."
            />
          }
        />
      </div>
    </div>
  );
}
