import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface PlatformSession {
  authUserId: string;
  platformAdminId: string;
  email: string;
  fullName: string;
}

/**
 * Sessão de control plane. platform_admin não tem tenant.
 * Lê a própria linha via RLS (policy select_own) — sem service_role.
 * Operações cross-tenant do /platform ainda usam admin client nas rotas.
 */
export async function getPlatformSession(): Promise<PlatformSession | null> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("platform_admin")
    .select("id, email, full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;

  return {
    authUserId: user.id,
    platformAdminId: data.id,
    email: data.email,
    fullName: data.full_name,
  };
}
