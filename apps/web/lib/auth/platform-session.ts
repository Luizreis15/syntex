import "server-only";
import { createSupabaseAdminClient } from "@syntex/database";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface PlatformSession {
  authUserId: string;
  platformAdminId: string;
  email: string;
  fullName: string;
}

/**
 * Sessão de control plane. platform_admin não tem tenant —
 * usa admin client só para ler a própria linha (RLS sem policy).
 */
export async function getPlatformSession(): Promise<PlatformSession | null> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
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
