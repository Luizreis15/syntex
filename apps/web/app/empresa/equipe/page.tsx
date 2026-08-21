import { redirect } from "next/navigation";
import { hasAnyGrant, primaryCompanyId } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { InviteCompanyUserForm } from "@/features/portal/invite-company-user-form";

export default async function EmpresaEquipePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const companyId = primaryCompanyId(session.grants);
  if (!companyId) redirect("/empresa");

  if (!hasAnyGrant(session.grants, "company.user.invite")) {
    return (
      <SyntexEmptyState
        title="Somente company_master convida"
        description="Operadores (company_user) não convidam outros usuários."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-component font-semibold text-ink">Equipe da empresa</h2>
      <p className="text-body text-ink-2">
        Convide um company_user com acesso às mesmas cobranças da empresa.
      </p>
      <InviteCompanyUserForm companyId={companyId} />
    </div>
  );
}
