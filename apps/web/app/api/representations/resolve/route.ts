import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { resolveRepresentationQuerySchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const parsed = resolveRepresentationQuerySchema.safeParse({
    establishmentId: request.nextUrl.searchParams.get("establishmentId"),
    date: request.nextUrl.searchParams.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data: establishment, error: establishmentError } = await session.supabase
    .from("establishment")
    .select("id, company:establishment_company_id_tenant_id_fkey(branch_id)")
    .eq("tenant_id", session.tenantId)
    .eq("id", parsed.data.establishmentId)
    .single();
  if (establishmentError || !establishment) {
    return NextResponse.json({ error: "estabelecimento não encontrado" }, { status: 404 });
  }

  const branchId = (establishment.company as unknown as { branch_id: string | null } | null)?.branch_id ?? null;
  const denied = checkPermission(session, "representation.read", { tenantId: session.tenantId, branchId });
  if (denied) return denied;

  const result = await resolveRepresentation(
    session.supabase,
    session.tenantId,
    parsed.data.establishmentId,
    parsed.data.date,
  );

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "union_representation",
    resourceId: result.representation?.id ?? null,
    metadata: { establishmentId: parsed.data.establishmentId, date: parsed.data.date, status: result.status },
  });

  return NextResponse.json({ data: result });
}
