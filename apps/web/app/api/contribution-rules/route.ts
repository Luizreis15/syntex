import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { contributionRuleCreateSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const body = await request.json();
  const parsed = contributionRuleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const denied = checkPermission(session, "contribution_rule.write", { tenantId: session.tenantId });
  if (denied) return denied;

  const { data: agreement, error: agreementError } = await session.supabase
    .from("collective_agreement")
    .select("id, valid_from, valid_until")
    .eq("tenant_id", session.tenantId)
    .eq("id", parsed.data.collectiveAgreementId)
    .single();
  if (agreementError || !agreement) {
    return NextResponse.json({ error: "convenção não encontrada" }, { status: 404 });
  }

  if (parsed.data.validFrom < agreement.valid_from || parsed.data.validFrom > agreement.valid_until) {
    return NextResponse.json({ error: "validFrom fora da vigência da CCT" }, { status: 422 });
  }
  if (parsed.data.validUntil && parsed.data.validUntil > agreement.valid_until) {
    return NextResponse.json({ error: "validUntil além do fim da CCT" }, { status: 422 });
  }

  const { data, error } = await session.supabase
    .from("contribution_rule")
    .insert({
      tenant_id: session.tenantId,
      collective_agreement_id: parsed.data.collectiveAgreementId,
      type: parsed.data.type,
      valid_from: parsed.data.validFrom,
      valid_until: parsed.data.validUntil ?? null,
      calculation_base: parsed.data.calculationBase,
      value_type: parsed.data.valueType,
      value: parsed.data.value,
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
    table: "contribution_rule",
    resourceId: data.id,
  });

  return NextResponse.json({ data }, { status: 201 });
}
