import Link from "next/link";
import { redirect } from "next/navigation";
import { allowedCompanyIds, isOfficePortalActor } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";

export default async function EscritorioHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isOfficePortalActor(session.grants)) redirect("/empresas");

  const companyScope = allowedCompanyIds(session.grants, "finance.read");
  const companyIds = companyScope === "all" ? [] : companyScope;

  if (companyIds.length === 0) {
    return (
      <SyntexEmptyState
        title="Nenhuma empresa delegada"
        description="Quando o sindicato vincular CNPJs ao escritório, eles aparecem aqui."
      />
    );
  }

  const { data: companies } = await session.supabase
    .from("company")
    .select("id, legal_name, trade_name, cnpj")
    .eq("tenant_id", session.tenantId)
    .in("id", companyIds)
    .order("legal_name");

  return (
    <div className="space-y-4">
      <h2 className="text-component font-semibold text-ink">Empresas sob delegação</h2>
      <p className="text-body text-ink-2">
        Você age em nome destas empresas (motivo e vigência registrados em delegação).
      </p>
      <ul className="divide-y divide-border border-y border-border">
        {(companies ?? []).map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-medium text-ink">{c.trade_name ?? c.legal_name}</p>
              <p className="font-mono text-label text-ink-2">{c.cnpj}</p>
            </div>
            <Link
              href={`/escritorio/empresa/${c.id}`}
              className="text-body text-petrol-700 hover:underline"
            >
              Ver cobranças
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
