import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { StaffForms } from "@/features/staff/staff-forms";

export default async function EquipePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "staff.read")) {
    return (
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Operação" }, { label: "Equipe" }]} title="Equipe" />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="staff.read é necessária." />
        </div>
      </div>
    );
  }

  const [{ data: departments }, { data: invites }] = await Promise.all([
    session.supabase
      .from("department")
      .select("id, name")
      .eq("tenant_id", session.tenantId)
      .order("name"),
    session.supabase
      .from("staff_invite")
      .select("id, email, role_name, scope, expires_at, accepted_at, revoked_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const canInvite = hasAnyGrant(session.grants, "staff.invite");

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Operação" }, { label: "Equipe" }]}
        title="Equipe"
        metadata={
          <span className="text-body text-ink-2">Setores (department) e convites internos</span>
        }
      />
      <div className="p-6">
        {canInvite ? (
          <StaffForms departments={departments ?? []} invites={invites ?? []} />
        ) : (
          <SyntexEmptyState
            title="Somente leitura"
            description="Você pode ver a equipe, mas não convidar (staff.invite)."
          />
        )}
      </div>
    </div>
  );
}
