import Link from "next/link";
import { createSyntexColumnHelper } from "@/components/ui/syntex-data-table";
import { SyntexStatus, type DomainState } from "@/components/ui/syntex-status";
import { formatCnpj } from "@/lib/formatters/cnpj";
import { representationBasisLabel } from "@/features/representations/basis-label";
import type { RepresentationListItem } from "@/features/representations/data";
import { representationValidityLabel } from "@/features/representations/validity-label";

const helper = createSyntexColumnHelper<RepresentationListItem>();



export const representationColumns = [
  helper.accessor("companyName", {
    id: "establishment",
    header: "Estabelecimento",
    meta: { label: "Estabelecimento" },
    cell: ({ row }) => (
      <Link href={`/representacao/${row.original.establishmentId}`} className="group block min-w-0 py-0.5">
        <span className="flex items-center gap-2">
          <span className="block truncate text-dense font-bold text-ink group-hover:text-petrol-700">
            {row.original.companyName}
          </span>
          <span className="shrink-0 rounded-control bg-surface-2 px-1.5 py-0.5 text-label font-semibold uppercase tracking-wide text-ink-3">
            {row.original.establishmentKind}
          </span>
        </span>
        <span className="font-mono text-label text-ink-3">{formatCnpj(row.original.establishmentCnpj)}</span>
      </Link>
    ),
  }),
  helper.accessor("municipalityName", {
    header: "Município",
    meta: { label: "Município" },
    cell: ({ getValue }) => (
      <span className="text-dense font-medium text-ink-2">{getValue() ?? "—"}</span>
    ),
  }),
  helper.accessor("status", {
    header: "Representação",
    meta: { label: "Representação" },
    cell: ({ getValue }) => {
      const status = getValue();
      if (status === "sem_representacao") {
        return <span className="text-label uppercase text-ink-3">Sem representação</span>;
      }
      return <SyntexStatus kind="domain" state={status as DomainState} />;
    },
  }),
  helper.display({
    id: "validity",
    header: "Vigência",
    meta: { label: "Vigência" },
    cell: ({ row }) => (
      <span className="font-mono text-label text-ink-2">{representationValidityLabel(row.original)}</span>
    ),
  }),
  helper.accessor("basis", {
    header: "Base",
    meta: { label: "Base" },
    cell: ({ getValue, row }) => (
      <span className="text-dense font-medium text-ink-2">
        {row.original.hasConflict ? "—" : representationBasisLabel(getValue())}
      </span>
    ),
  }),
];
