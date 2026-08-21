import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@syntex/database";
import {
  isAssociatePortalActor,
  isCompanyPortalActor,
  isOfficePortalActor,
} from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Roteador pós-login:
 * platform → /platform · associado → /associado · escritório → /escritorio ·
 * empresa → /empresa · sindicato → /empresas
 */
export default async function InicioPage() {
  const platform = await getPlatformSession();
  if (platform) redirect("/platform");

  const session = await getSession();
  if (session) {
    if (isAssociatePortalActor(session.grants)) redirect("/associado");
    if (isOfficePortalActor(session.grants)) redirect("/escritorio");
    if (isCompanyPortalActor(session.grants)) redirect("/empresa");
    redirect("/empresas");
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("platform_admin")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (data) redirect("/platform");
  }

  redirect("/login");
}
