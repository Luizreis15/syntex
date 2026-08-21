import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { hasAnyGrant } from "@syntex/permissions";
import { generateObligationSchema } from "@syntex/validation";
import { requireSession, checkPermission } from "@/lib/auth/require-permission";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  if (!hasAnyGrant(session.grants, "finance.read")) {
    return NextResponse.json({ error: "não autorizado" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  let query = session.supabase
    .from("charge")
    .select(
      `
      id, amount, due_date, status, paid_at, payment_method, created_at, obligation_id,
      obligation:obligation_id(
        competence, company_id, status,
        company:company_id(legal_name, trade_name, cnpj)
      )
    `,
    )
    .eq("tenant_id", session.tenantId)
    .order("due_date", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "charge",
    metadata: { count: data?.length ?? 0, status },
  });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "finance.write", { tenantId: session.tenantId });
  if (denied) return denied;

  const body = await request.json();
  const parsed = generateObligationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data: company } = await session.supabase
    .from("company")
    .select("id, branch_id")
    .eq("tenant_id", session.tenantId)
    .eq("id", parsed.data.companyId)
    .maybeSingle();
  if (!company) return NextResponse.json({ error: "empresa não encontrada" }, { status: 404 });

  const branchDenied = checkPermission(session, "finance.write", {
    tenantId: session.tenantId,
    branchId: company.branch_id,
  });
  if (branchDenied) return branchDenied;

  try {
    const result = await generateObligationWithCharge(session.supabase, {
      tenantId: session.tenantId,
      companyId: parsed.data.companyId,
      contributionRuleId: parsed.data.contributionRuleId,
      competence: parsed.data.competence,
      calculationBaseAmount: parsed.data.calculationBaseAmount,
      dueDate: parsed.data.dueDate,
    });

    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: result.created ? "create" : "read",
      table: "obligation",
      resourceId: result.obligation.id,
      metadata: { chargeId: result.charge.id, created: result.created },
    });

    return NextResponse.json({ data: result }, { status: result.created ? 201 : 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao gerar obrigação";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
