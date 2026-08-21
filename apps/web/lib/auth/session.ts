import "server-only";
import type { SupabaseServerClient } from "@syntex/database";
import type { RoleName, UserGrant } from "@syntex/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { listActiveCompanyDelegations } from "@/lib/domain/office";

export interface Session {
  supabase: SupabaseServerClient;
  authUserId: string;
  appUserId: string;
  tenantId: string;
  grants: UserGrant[];
}

/**
 * Resolve a sessão da requisição: usuário autenticado, seu app_user/tenant,
 * e a matriz de grants (role -> scope) usada por packages/permissions.
 * Delegações ativas company → grants sintéticos scope=company (ADR-015).
 */
export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: appUser, error: appUserError } = await supabase
    .from("app_user")
    .select("id, tenant_id")
    .eq("auth_user_id", user.id)
    .single();
  if (appUserError || !appUser) return null;

  const { data: userRoles, error: userRolesError } = await supabase
    .from("user_role")
    .select(
      "scope, branch_id, department_id, company_id, office_id, role:user_role_role_id_tenant_id_fkey(name)",
    )
    .eq("app_user_id", appUser.id);
  if (userRolesError) return null;

  const grants: UserGrant[] = (userRoles ?? []).map((ur) => ({
    role: (ur.role as unknown as { name: RoleName }).name,
    scope: ur.scope as UserGrant["scope"],
    branchId: ur.branch_id,
    departmentId: ur.department_id,
    companyId: ur.company_id,
    officeId: ur.office_id,
  }));

  const officeRoleByOffice = new Map<string, RoleName>();
  for (const g of grants) {
    if (
      (g.role === "office_master" || g.role === "office_user") &&
      g.scope === "office" &&
      g.officeId
    ) {
      officeRoleByOffice.set(g.officeId, g.role);
    }
  }

  if (officeRoleByOffice.size > 0) {
    try {
      const delegations = await listActiveCompanyDelegations(
        supabase,
        appUser.tenant_id,
        appUser.id,
      );
      for (const d of delegations) {
        const role =
          (d.officeId && officeRoleByOffice.get(d.officeId)) ||
          [...officeRoleByOffice.values()][0];
        if (!role) continue;
        grants.push({
          role,
          scope: "company",
          companyId: d.companyId,
          officeId: d.officeId,
        });
      }
    } catch {
      // sessão sem expansão ainda é utilizável para rotas não-empresa
    }
  }

  return {
    supabase,
    authUserId: user.id,
    appUserId: appUser.id,
    tenantId: appUser.tenant_id,
    grants,
  };
}
