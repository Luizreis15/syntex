import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { membershipCreateSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";

/**
 * Registra um novo período de status de filiação.
 * Se houver membership vigente (valid_until null), encerra na véspera do novo valid_from.
 */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "membership.write", { tenantId: session.tenantId });
  if (denied) return denied;

  const body = await request.json();
  const parsed = membershipCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data: person } = await session.supabase
    .from("person")
    .select("id")
    .eq("tenant_id", session.tenantId)
    .eq("id", parsed.data.personId)
    .maybeSingle();
  if (!person) return NextResponse.json({ error: "pessoa não encontrada" }, { status: 404 });

  const { data: open } = await session.supabase
    .from("membership")
    .select("id, valid_from")
    .eq("tenant_id", session.tenantId)
    .eq("person_id", parsed.data.personId)
    .is("valid_until", null)
    .maybeSingle();

  if (open) {
    const dayBefore = new Date(parsed.data.validFrom);
    dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
    const until = dayBefore.toISOString().slice(0, 10);
    if (until < open.valid_from) {
      return NextResponse.json(
        { error: "nova filiação começa antes do período vigente" },
        { status: 422 },
      );
    }
    const { error: closeError } = await session.supabase
      .from("membership")
      .update({ valid_until: until })
      .eq("id", open.id)
      .eq("tenant_id", session.tenantId);
    if (closeError) return NextResponse.json({ error: closeError.message }, { status: 400 });
  }

  const { data, error } = await session.supabase
    .from("membership")
    .insert({
      tenant_id: session.tenantId,
      person_id: parsed.data.personId,
      status: parsed.data.status,
      valid_from: parsed.data.validFrom,
      valid_until: parsed.data.validUntil ?? null,
      category: parsed.data.category ?? null,
      contribution_form: parsed.data.contributionForm ?? null,
    })
    .select()
    .single();

  if (error) {
    const status = error.code === "23P01" ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "create",
    table: "membership",
    resourceId: data.id,
  });

  return NextResponse.json({ data }, { status: 201 });
}
