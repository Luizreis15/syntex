import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, recordAudit } from "@syntex/database";
import { z } from "zod";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { cancelCharge, createPlatformNotification } from "@/lib/domain/platform-ops";

const schema = z.object({
  tenantId: z.string().uuid(),
  chargeId: z.string().uuid(),
  reason: z.string().min(3).max(500),
});

export async function POST(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "não autorizado (platform)" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  try {
    const charge = await cancelCharge(admin, {
      tenantId: parsed.data.tenantId,
      chargeId: parsed.data.chargeId,
      reason: parsed.data.reason,
      platformAdminId: session.platformAdminId,
    });

    await recordAudit(admin, {
      tenantId: parsed.data.tenantId,
      actorId: null,
      action: "update",
      table: "charge",
      resourceId: charge.id,
      metadata: {
        event: "cancelled",
        by: session.platformAdminId,
        reason: parsed.data.reason,
      },
    });

    await createPlatformNotification(admin, {
      title: "Cobrança cancelada",
      body: `Cobrança ${charge.id.slice(0, 8)}… cancelada: ${parsed.data.reason}`,
      severity: "warning",
      tenantId: parsed.data.tenantId,
      chargeId: charge.id,
      createdByPlatformAdminId: session.platformAdminId,
    });

    return NextResponse.json({ data: charge });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao cancelar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
