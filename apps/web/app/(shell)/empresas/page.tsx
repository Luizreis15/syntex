import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import {
  fetchCompaniesPage,
  fetchCompaniesStatusSummary,
} from "@/features/companies/data";
import { CompaniesTable } from "@/features/companies/companies-table";
import { EmpresasListHeader } from "@/features/companies/components/empresas-list-header";

const PAGE_SIZE = 20;

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: { q?: string; municipio?: string; status?: string; page?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "company.read")) {
    return (
      <div className="px-6 py-12">
        <SyntexEmptyState
          title="Sem permissão para ver empresas"
          description="Sua conta não tem a permissão company.read. Peça a um administrador para conceder acesso."
        />
      </div>
    );
  }

  const pageIndex = Math.max(0, Number(searchParams.page ?? "1") - 1);
  const canCreate =
    hasAnyGrant(session.grants, "company.master.provision") ||
    hasAnyGrant(session.grants, "company.write");

  const [page, summary] = await Promise.all([
    fetchCompaniesPage(session.supabase, session.tenantId, session.grants, {
      q: searchParams.q,
      municipio: searchParams.municipio,
      status: searchParams.status,
      pageIndex,
      pageSize: PAGE_SIZE,
    }),
    fetchCompaniesStatusSummary(session.supabase, session.tenantId, session.grants),
  ]);

  return (
    <div className="min-h-full bg-paper">
      <EmpresasListHeader
        summary={summary}
        activeStatus={searchParams.status ?? null}
        canCreate={canCreate}
      />
      <div className="px-6 py-5 xl:px-8">
        <CompaniesTable page={page} pageIndex={pageIndex} q={searchParams.q ?? ""} />
      </div>
    </div>
  );
}
