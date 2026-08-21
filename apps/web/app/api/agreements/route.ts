import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { hasAnyGrant } from "@syntex/permissions";
import { requireSession } from "@/lib/auth/require-permission";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  if (!hasAnyGrant(session.grants, "agreement.read")) {
    return NextResponse.json({ error: "não autorizado" }, { status: 403 });
  }

  const date = request.nextUrl.searchParams.get("date");
  let query = session.supabase
    .from("collective_agreement")
    .select(
      "id, kind, mediador_number, valid_from, valid_until, base_date, economic_category_id, professional_category_id",
    )
    .eq("tenant_id", session.tenantId)
    .order("valid_from", { ascending: false })
    .limit(100);

  if (date) {
    query = query.lte("valid_from", date).gte("valid_until", date);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "collective_agreement",
    metadata: { date: date ?? null, count: data?.length ?? 0 },
  });

  return NextResponse.json({ data });
}
