import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchCompaniesPage } from "@/features/companies/data";
import { CompaniesTable } from "@/features/companies/companies-table";

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
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Relações" }, { label: "Empresas" }]} title="Empresas" />
        <div className="p-6">
          <SyntexEmptyState
            title="Sem permissão para ver empresas"
            description="Sua conta não tem a permissão company.read. Peça a um administrador para conceder acesso."
          />
        </div>
      </div>
    );
  }

  const pageIndex = Math.max(0, Number(searchParams.page ?? "1") - 1);
  const page = await fetchCompaniesPage(session.supabase, session.tenantId, session.grants, {
    q: searchParams.q,
    municipio: searchParams.municipio,
    status: searchParams.status,
    pageIndex,
    pageSize: PAGE_SIZE,
  });

  return (
    <div>
      <SyntexPageHeader breadcrumbs={[{ label: "Relações" }, { label: "Empresas" }]} title="Empresas" />
      <div className="p-6">
        <CompaniesTable page={page} pageIndex={pageIndex} q={searchParams.q ?? ""} />
      </div>
    </div>
  );
}
