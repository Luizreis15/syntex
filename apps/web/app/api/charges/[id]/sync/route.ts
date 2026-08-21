import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { syncPaymentSchema } from "@syntex/validation";
import { requireSession } from "@/lib/auth/require-permission";
import { syncChargePaymentStatus } from "@/lib/domain/payment-intent";
import { canPayOrWriteCharge, resolveChargeCompanyId } from "@/lib/domain/company-portal";
import { isCompanyPortalActor } from "@syntex/permissions";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const companyId = await resolveChargeCompanyId(session.supabase, session.tenantId, params.id);
  if (
    !canPayOrWriteCharge(session.grants, session.tenantId, companyId, session.appUserId)
  ) {
    return NextResponse.json({ error: "não autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = syncPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Portal empresa não força pagamento — só sync real / stub sem force.
  const forceStatus = isCompanyPortalActor(session.grants) ? undefined : parsed.data.forceStatus;

  try {
    const result = await syncChargePaymentStatus(session.supabase, {
      tenantId: session.tenantId,
      chargeId: params.id,
      forceStatus,
    });

    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "update",
      table: "charge",
      resourceId: params.id,
      metadata: { event: "sync", gatewayStatus: result.gatewayStatus },
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao sincronizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
