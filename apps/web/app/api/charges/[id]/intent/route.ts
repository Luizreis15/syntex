import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { createPaymentIntentSchema } from "@syntex/validation";
import { requireSession } from "@/lib/auth/require-permission";
import { createChargePaymentIntent } from "@/lib/domain/payment-intent";
import { canPayOrWriteCharge, resolveChargeCompanyId } from "@/lib/domain/company-portal";

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

  const body = await request.json();
  const parsed = createPaymentIntentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const result = await createChargePaymentIntent(session.supabase, {
      tenantId: session.tenantId,
      chargeId: params.id,
      billingType: parsed.data.billingType,
    });

    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "update",
      table: "charge",
      resourceId: params.id,
      metadata: {
        event: "intent_created",
        provider: result.intent.provider,
        billingType: parsed.data.billingType,
        portal: true,
      },
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao criar intent";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
