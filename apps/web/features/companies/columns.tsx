import Link from "next/link";
import { createSyntexColumnHelper } from "@/components/ui/syntex-data-table";
import { SyntexStatus, type DomainState } from "@/components/ui/syntex-status";
import { SyntexValidityBand } from "@/components/ui/syntex-validity-band";
import { formatCnpj } from "@/lib/formatters/cnpj";
import type { CompanyRow } from "./data";

const helper = createSyntexColumnHelper<CompanyRow>();
const today = new Date().toISOString().slice(0, 10);

export const companyColumns = [
  helper.accessor((row) => row.tradeName ?? row.legalName, {
    id: "name",
    header: "Empresa",
    meta: { label: "Empresa" },
    cell: ({ row }) => (
      <Link href={`/empresas/${row.original.id}`} className="group block min-w-0 py-0.5">
        <span className="block truncate text-dense font-bold text-ink group-hover:text-petrol-700">
          {row.original.tradeName ?? row.original.legalName}
        </span>
        <span className="font-mono text-label text-ink-3">{formatCnpj(row.original.cnpj)}</span>
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
  helper.accessor("validity", {
    header: "Vigência",
    meta: { label: "Vigência" },
    cell: ({ getValue }) => (
      <div className="w-36">
        <SyntexValidityBand periods={getValue()} referenceDate={today} />
      </div>
    ),
  }),
];
