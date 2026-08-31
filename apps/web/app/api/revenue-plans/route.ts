import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { revenuePlanCreateSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { calculationBaseLabel, fetchRevenuePlanViews, valueTypeForMethod } from "@/lib/domain/revenue-plan";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  const denied = checkPermission(session, "contribution_rule.read", { tenantId: session.tenantId });
  if (denied) return denied;

  try {
    const data = await fetchRevenuePlanViews(session.supabase, session.tenantId);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "não foi possível carregar os planos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  const denied = checkPermission(session, "contribution_rule.write", { tenantId: session.tenantId });
  if (denied) return denied;

  const parsed = revenuePlanCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;
  const agreementId =
    input.sourceType === "collective_agreement" ? input.collectiveAgreementId ?? null : null;

  if (agreementId) {
    const { data: agreement } = await session.supabase
      .from("collective_agreement")
      .select("id, valid_from, valid_until")
      .eq("tenant_id", session.tenantId)
      .eq("id", agreementId)
      .maybeSingle();
    if (!agreement) return NextResponse.json({ error: "CCT/ACT não encontrada" }, { status: 404 });
    if (input.validFrom < agreement.valid_from || input.validFrom > agreement.valid_until) {
      return NextResponse.json({ error: "início do plano fora da vigência da CCT/ACT" }, { status: 422 });
    }
    if (input.validUntil && input.validUntil > agreement.valid_until) {
      return NextResponse.json({ error: "fim do plano além da vigência da CCT/ACT" }, { status: 422 });
    }
  }

  const { data: plan, error: planError } = await session.supabase
    .from("revenue_plan")
    .insert({
      tenant_id: session.tenantId,
      name: input.name,
      type: input.type,
      source_type: input.sourceType,
      collective_agreement_id: agreementId,
      clause_reference: input.clauseReference ?? null,
      liable_party: input.liableParty,
      collection_role: input.collectionRole,
      audience: input.audience,
      frequency: input.frequency,
      due_day: input.dueDay,
      valid_from: input.validFrom,
      valid_until: input.validUntil ?? null,
      opposition_applies: input.oppositionApplies,
      status: input.status,
      created_by: session.appUserId,
    })
    .select()
    .single();

  if (planError || !plan) {
    const status = planError?.code === "23P01" || planError?.code === "23505" ? 409 : 400;
    return NextResponse.json(
      { error: status === 409 ? "já existe um plano conflitante nesta vigência" : "não foi possível salvar o plano" },
      { status },
    );
  }

  const { data: rule, error: ruleError } = await session.supabase
    .from("contribution_rule")
    .insert({
      tenant_id: session.tenantId,
      revenue_plan_id: plan.id,
      collective_agreement_id: agreementId,
      type: input.type,
      calculation_method: input.calculationMethod,
      calculation_base: calculationBaseLabel(input.calculationMethod),
      value_type: valueTypeForMethod(input.calculationMethod),
      value: input.value,
      valid_from: input.validFrom,
      valid_until: input.validUntil ?? null,
    })
    .select()
    .single();

  if (ruleError || !rule) {
    await session.supabase.from("revenue_plan").delete().eq("id", plan.id).eq("tenant_id", session.tenantId);
    return NextResponse.json({ error: "não foi possível salvar a regra de cálculo do plano" }, { status: 400 });
  }

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "create",
    table: "revenue_plan",
    resourceId: plan.id,
    metadata: {
      capability: "revenue_plan",
      type: plan.type,
      contribution_rule_id: rule.id,
      calculation_method: rule.calculation_method,
      status: plan.status,
      classification: "financeiro",
    },
  });

  return NextResponse.json(
    {
      data: {
        ...plan,
        contribution_rule_id: rule.id,
        calculation_method: rule.calculation_method,
        calculation_base: rule.calculation_base,
        value_type: rule.value_type,
        value: rule.value,
      },
    },
    { status: 201 },
  );
}
