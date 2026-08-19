"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SyntexDataTable } from "@/components/ui/syntex-data-table";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { companyColumns } from "./columns";
import type { CompaniesPage } from "./data";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
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

          <select
            value={searchParams.get("municipio") ?? ""}
            onChange={(e) => updateParams({ municipio: e.target.value || null })}
            className="h-input rounded-sm border border-border bg-surface px-2 text-body text-ink"
          >
            <option value="">Todos os municípios</option>
            {page.municipalityOptions.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={searchParams.get("status") ?? ""}
            onChange={(e) => updateParams({ status: e.target.value || null })}
            className="h-input rounded-sm border border-border bg-surface px-2 text-body text-ink"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      }
    />
  );
}
