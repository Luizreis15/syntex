import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { contributionAssessmentSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { createContributionAssessment } from "@/lib/domain/contribution-assessment";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  const denied = checkPermission(session, "finance.write", { tenantId: session.tenantId });
  if (denied) return denied;

  const parsed = contributionAssessmentSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const data = await createContributionAssessment(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      ...parsed.data,
    });
    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "create",
      table: "contribution_assessment",
      resourceId: data.id,
      metadata: {
        companyId: data.company_id,
        planId: data.revenue_plan_id,
        competence: data.competence,
        amount: data.amount,
        classification: "financeiro",
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "não foi possível confirmar a apuração";
    const status = /já existe/.test(message) ? 409 : /não encontrad|não pertence/.test(message) ? 404 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}

