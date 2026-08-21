"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  columnVisibilityFeature,
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { IconCheck, IconChevronDown } from "./icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./dropdown-menu";

const features = tableFeatures({ columnVisibilityFeature, rowSelectionFeature });
export type SyntexTableFeatures = typeof features;

export function createSyntexColumnHelper<TData extends RowData>() {
  return createColumnHelper<SyntexTableFeatures, TData>();
}

export interface SyntexDataTablePagination {
  pageIndex: number;
  pageSize: number;
  rowCount: number;
  onPageChange: (pageIndex: number) => void;
}

export interface SyntexDataTableProps<TData extends RowData> {
  columns: ColumnDef<SyntexTableFeatures, TData, any>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  toolbar?: ReactNode;
  emptyState: ReactNode;
  isLoading?: boolean;
  pagination?: SyntexDataTablePagination;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedIds: string[]) => void;
  density?: "comfortable" | "compact";
  "aria-label": string;
}

/**
 * A DataTable é componente core do produto (design/SYNTEX-UI.md §31 /
 * prompt 02 §4). Sorting e filtro são resolvidos fora daqui — ordenação e
 * paginação são "server-side" e vivem na URL de quem chama; este primitive
 * só renderiza a página que já chegou pronta e concentra seleção,
 * visibilidade de coluna e os estados obrigatórios (loading/empty).
 */
export function SyntexDataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  toolbar,
  emptyState,
  isLoading,
  pagination,
  enableRowSelection,
  onRowSelectionChange,
  density = "comfortable",
  "aria-label": ariaLabel,
}: SyntexDataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const allColumns = useMemo<ColumnDef<SyntexTableFeatures, TData, any>[]>(() => {
    if (!enableRowSelection) return columns;
    const helper = createSyntexColumnHelper<TData>();
    const selectColumn = helper.display({
      id: "__select__",
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Selecionar todas as linhas"
          checked={table.getIsAllRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
          }}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="h-3.5 w-3.5 accent-petrol-700"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={`Selecionar linha ${row.id}`}
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-3.5 w-3.5 accent-petrol-700"
        />
      ),
    });
    return [selectColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useTable({
    features,
    columns: allColumns,
    data,
    getRowId,
    state: { rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
  });

  useEffect(() => {
    if (!onRowSelectionChange) return;
    onRowSelectionChange(Object.keys(rowSelection).filter((id) => rowSelection[id]));
  }, [rowSelection, onRowSelectionChange]);

  const rowHeight = density === "compact" ? "h-9" : "h-row";
  const bodyText = density === "compact" ? "text-dense" : "text-body";

  const pageCount = pagination ? Math.max(1, Math.ceil(pagination.rowCount / pagination.pageSize)) : 1;
  const resultCount = pagination?.rowCount ?? data.length;
  const hideableColumns = table.getAllLeafColumns().filter((column) => column.id !== "__select__");

  return (
    <div role="table" aria-label={ariaLabel} className="flex flex-col gap-3">
      {toolbar}

      <div className="flex items-center justify-between text-label text-ink-3">
        <span>
          {resultCount} {resultCount === 1 ? "resultado" : "resultados"}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-label uppercase text-ink-2 hover:bg-surface-2"
            >
              Colunas
              <IconChevronDown size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hideableColumns.map((column) => {
              const label = (column.columnDef.meta as { label?: string } | undefined)?.label ?? column.id;
              return (
                <button
                  key={column.id}
                  type="button"
                  onClick={() => column.toggleVisibility()}
                  className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-body text-ink hover:bg-surface-2"
                >
                  <span className="flex h-3.5 w-3.5 items-center justify-center">
                    {column.getIsVisible() && <IconCheck size={14} className="text-petrol-700" />}
                  </span>
                  {label}
                </button>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id} className="border-b border-border bg-surface-2">
                  {group.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-3 py-2 text-left text-label uppercase text-ink-3"
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className={cn("border-b border-border", rowHeight)}>
                    {allColumns.map((_, ci) => (
                      <td key={ci} className="px-3 py-2">
                        <div className="h-3.5 w-full max-w-[160px] animate-pulse rounded-xs bg-surface-2" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && data.length === 0 && (
                <tr>
                  <td colSpan={allColumns.length} className="px-3 py-8">
                    {emptyState}
                  </td>
                </tr>
              )}

              {!isLoading &&
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border last:border-b-0 hover:bg-surface-2",
                      rowHeight,
                      row.getIsSelected() && "bg-petrol-100",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={cn("px-3", bodyText, "text-ink")}>
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && data.length > 0 && (
        <div className="flex items-center justify-end text-label text-ink-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="disabled:opacity-40"
              disabled={pagination.pageIndex === 0}
              onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
            >
              <IconChevronDown size={14} className="rotate-90" />
              <span className="sr-only">Página anterior</span>
            </button>
            <span>
              Página {pagination.pageIndex + 1} de {pageCount}
            </span>
            <button
              type="button"
              className="disabled:opacity-40"
              disabled={pagination.pageIndex + 1 >= pageCount}
              onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
            >
              <IconChevronDown size={14} className="-rotate-90" />
              <span className="sr-only">Próxima página</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
