import { NextResponse } from "next/server";
import { can, type PermissionKey, type ResourceContext } from "@syntex/permissions";
import { getSession, type Session } from "./session";

/**
 * Resolve a sessão da requisição ou devolve 401. RLS já garante isolamento
 * de tenant no banco; a checagem fina (permission x scope) fica a cargo de
 * `checkPermission`, chamada depois que a rota souber o recurso concreto —
 * CLAUDE.md #2.
 */
export async function requireSession(): Promise<{ session: Session } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "não autenticado" }, { status: 401 }) };
  }
  return { session };
}

/** Nega com 403 se a sessão não tiver a permissão para o recurso dado. */
export function checkPermission(
  session: Session,
  permission: PermissionKey,
  resource: ResourceContext,
): NextResponse | null {
  if (!can(session.grants, permission, session.tenantId, resource, session.appUserId)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 403 });
  }
  return null;
}
