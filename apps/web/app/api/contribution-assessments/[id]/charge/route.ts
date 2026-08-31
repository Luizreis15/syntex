import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { generateChargeFromAssessment } from "@/lib/domain/contribution-assessment";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  const denied = checkPermission(session, "finance.write", { tenantId: session.tenantId });
  if (denied) return denied;

  try {
    const result = await generateChargeFromAssessment(session.supabase, {
      tenantId: session.tenantId,
      assessmentId: params.id,
    });
    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "create",
      table: "charge",
      resourceId: result.chargeId,
      metadata: {
        assessmentId: params.id,
        obligationId: result.obligationId,
        created: result.created,
        classification: "financeiro",
      },
    });
    return NextResponse.json({ data: result }, { status: result.created ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "não foi possível gerar a cobrança";
    return NextResponse.json({ error: message }, { status: /não encontrad/.test(message) ? 404 : 422 });
  }
}

