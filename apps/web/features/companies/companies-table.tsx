"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
 * Filtro refletido na URL (design/SYNTEX-UI.md §14: "URL é estado") — busca,
 * município e status viram searchParams, então a lista sobrevive a recarregar
 * a página e a compartilhar o link.
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
    <SyntexDataTable
      aria-label="Empresas"
      columns={companyColumns}
      data={page.rows}
      getRowId={(row) => row.id}
      isLoading={isPending}
      enableRowSelection
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
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ q: search || null });
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por CNPJ ou razão social"
              className="h-input w-full max-w-xs rounded-sm border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-petrol-600"
            />
          </form>

          <SyntexSelect
            aria-label="Filtrar por município"
            value={searchParams.get("municipio") ?? ""}
            onValueChange={(value) => updateParams({ municipio: value || null })}
            options={[{ value: "", label: "Todos os municípios" }, ...page.municipalityOptions.map((m) => ({ value: m.slug, label: m.name }))]}
          />

          <SyntexSelect
            aria-label="Filtrar por status de representação"
            value={searchParams.get("status") ?? ""}
            onValueChange={(value) => updateParams({ status: value || null })}
            options={STATUS_OPTIONS}
          />
        </div>
      }
    />
  );
}
