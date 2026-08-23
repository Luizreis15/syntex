import Link from "next/link";
import { cn } from "@/lib/utils";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { formatEmploymentPeriod } from "@/features/workers/trabalhador-360-compose";

export function Trabalhador360Vinculos({
  employments,
}: {
  employments: {
    id: string;
    job_title: string | null;
    status: string;
    valid_from: string;
    valid_until: string | null;
    company: { id: string; legal_name: string; trade_name: string | null } | null;
  }[];
}) {
  return (
    <DashboardPanel title="Vínculos" subtitle="Histórico empregatício">
      {employments.length === 0 ? (
        <p className="px-5 py-8 text-body text-ink-2">Nenhum vínculo cadastrado.</p>
      ) : (
        <ul className="divide-y divide-border/55">
          {employments.map((e) => {
            const active = e.status === "ativo" && !e.valid_until;
            const name = e.company?.trade_name ?? e.company?.legal_name ?? "Empresa";
            return (
              <li key={e.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={cn(
                    "mt-1.5 size-2 rounded-full",
                    active ? "bg-success" : "bg-ink-3",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  {e.company ? (
                    <Link
                      href={`/empresas/${e.company.id}`}
                      className="block text-dense font-bold text-ink hover:text-petrol-700"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="block text-dense font-bold text-ink">{name}</span>
                  )}
                  <span className="font-mono text-label text-ink-3">
                    {formatEmploymentPeriod(e.valid_from, e.valid_until)}
                    {e.job_title ? ` · ${e.job_title}` : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
