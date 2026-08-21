import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { CreateCompanyWithMasterForm } from "@/features/companies/create-company-with-master-form";

export default async function NovaEmpresaComMasterPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "company.master.provision")) {
    return (
      <div>
        <SyntexPageHeader
          breadcrumbs={[{ label: "Relações" }, { label: "Empresas", href: "/empresas" }, { label: "Nova" }]}
          title="Empresa + master"
        />
        <div className="p-6">
          <SyntexEmptyState
            title="Sem permissão"
            description="company.master.provision é necessária."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Relações" }, { label: "Empresas", href: "/empresas" }, { label: "Nova" }]}
        title="Empresa + company master"
        actions={
          <Link href="/empresas" className="text-body text-petrol-700 hover:underline">
            Voltar
          </Link>
        }
      />
      <div className="p-6">
        <CreateCompanyWithMasterForm />
      </div>
    </div>
  );
}
