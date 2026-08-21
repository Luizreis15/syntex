import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { z } from "zod";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { issueAssociateAccess } from "@/lib/domain/associate-access";

const schema = z.object({
  personId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const denied = checkPermission(session, "associate.access.issue", {
    tenantId: session.tenantId,
  });
  if (denied) return denied;

  try {
    const result = await issueAssociateAccess(session.supabase, {
      tenantId: session.tenantId,
      personId: parsed.data.personId,
      invitedBy: session.appUserId,
    });

    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "create",
      table: "staff_invite",
      resourceId: result.inviteId,
      metadata: { event: "associate_access_issued", personId: parsed.data.personId },
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao emitir acesso";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
