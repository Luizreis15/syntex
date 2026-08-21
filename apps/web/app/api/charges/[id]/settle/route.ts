import { NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "finance.write", { tenantId: session.tenantId });
  if (denied) return denied;

  const { data: charge, error: chargeError } = await session.supabase
    .from("charge")
    .select("id, obligation_id")
    .eq("tenant_id", session.tenantId)
    .eq("id", params.id)
    .maybeSingle();
  if (chargeError || !charge) {
    return NextResponse.json({ error: "cobrança não encontrada" }, { status: 404 });
  }

  const { data, error } = await session.supabase.rpc("settle_charge_manual", {
    p_tenant_id: session.tenantId,
    p_charge_id: params.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "update",
    table: "charge",
    resourceId: params.id,
    metadata: { event: "settled_manual" },
  });

  return NextResponse.json({ data });
}
