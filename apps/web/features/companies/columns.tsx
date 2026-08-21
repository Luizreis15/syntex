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
      <Link href={`/empresas/${row.original.id}`} className="font-medium text-ink hover:text-petrol-700">
        {row.original.tradeName ?? row.original.legalName}
      </Link>
    ),
  }),
  helper.accessor("cnpj", {
    header: "CNPJ",
    meta: { label: "CNPJ" },
    cell: ({ getValue }) => <span className="font-mono text-ink-2">{formatCnpj(getValue())}</span>,
  }),
  helper.accessor("municipalityName", {
    header: "Município",
    meta: { label: "Município" },
    cell: ({ getValue }) => <span className="text-ink-2">{getValue() ?? "—"}</span>,
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
      <div className="w-32">
        <SyntexValidityBand periods={getValue()} referenceDate={today} />
      </div>
    ),
  }),
];
