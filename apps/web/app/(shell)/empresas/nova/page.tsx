import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { CreateCompanyForm } from "@/features/companies/create-company-form";

export default async function NovaEmpresaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canProvision =
    hasAnyGrant(session.grants, "company.master.provision") ||
    hasAnyGrant(session.grants, "company.write");

  if (!canProvision) {
    return (
      <div>
        <SyntexPageHeader
          breadcrumbs={[
            { label: "Cadastro" },
            { label: "Empresas", href: "/empresas" },
            { label: "Nova" },
          ]}
          title="Nova empresa"
        />
        <div className="p-6">
          <SyntexEmptyState
            title="Sem permissão"
            description="É necessário company.master.provision ou company.write."
          />
        </div>
      </div>
    );
  }

  const { data: branches } = await session.supabase
    .from("branch")
    .select("id, name")
    .eq("tenant_id", session.tenantId)
    .order("name");

  const { data: cnaes } = await session.supabase
    .from("cnae")
    .select("id, code, description")
    .order("code")
    .limit(400);

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[
          { label: "Cadastro" },
          { label: "Empresas", href: "/empresas" },
          { label: "Nova" },
        ]}
        title="Nova empresa"
        metadata={
          <span className="text-body text-ink-2">
            Identificação · endereço · responsável pela conta · matriz
          </span>
        }
      />
      <div className="p-6">
        <CreateCompanyForm
          branches={(branches ?? []).map((b) => ({ id: b.id, label: b.name }))}
          cnaes={(cnaes ?? []).map((c) => ({
            id: c.id,
            label: `${c.code} — ${c.description}`,
          }))}
        />
      </div>
    </div>
  );
}
