import "server-only";
import type { SupabaseServerClient } from "@syntex/database";
import type { RoleName, UserGrant } from "@syntex/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
 * Retorna null se não houver sessão — a rota decide se isso é 401 ou redirect.
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

  // O embed usa o nome da FK composta (role_id, tenant_id) explicitamente —
  // o PostgREST não infere a relação de embedding a partir de uma FK
  // composta sem essa dica.
  const { data: userRoles, error: userRolesError } = await supabase
    .from("user_role")
    .select("scope, branch_id, role:user_role_role_id_tenant_id_fkey(name)")
    .eq("app_user_id", appUser.id);
  if (userRolesError) return null;

  const grants: UserGrant[] = (userRoles ?? []).map((ur) => ({
    role: (ur.role as unknown as { name: RoleName }).name,
    scope: ur.scope as UserGrant["scope"],
    branchId: ur.branch_id,
  }));

  return {
    supabase,
    authUserId: user.id,
    appUserId: appUser.id,
    tenantId: appUser.tenant_id,
    grants,
  };
}
