import { redirect } from "next/navigation";
import {
  isAssociatePortalActor,
  isCompanyPortalActor,
  isOfficePortalActor,
} from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { getPlatformSession } from "@/lib/auth/platform-session";

/**
 * Roteador pós-login:
 * platform → /platform · associado → /associado · escritório → /escritorio ·
 * empresa → /empresa · sindicato → /painel
 */
export default async function InicioPage() {
  const platform = await getPlatformSession();
  if (platform) redirect("/platform");

  const session = await getSession();
  if (session) {
    if (isAssociatePortalActor(session.grants)) redirect("/associado");
    if (isOfficePortalActor(session.grants)) redirect("/escritorio");
    if (isCompanyPortalActor(session.grants)) redirect("/empresa");
    redirect("/painel");
  }

  redirect("/login");
}
