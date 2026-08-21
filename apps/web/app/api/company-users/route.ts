import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { z } from "zod";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { primaryCompanyId } from "@syntex/permissions";
import { inviteCompanyUser } from "@/lib/domain/invite-company-user";

const schema = z.object({
  email: z.string().email(),
  companyId: z.string().uuid().optional(),
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

  const companyId = parsed.data.companyId ?? primaryCompanyId(session.grants);
  if (!companyId) {
    return NextResponse.json({ error: "companyId obrigatório" }, { status: 422 });
  }

  const denied = checkPermission(session, "company.user.invite", {
    tenantId: session.tenantId,
    companyId,
  });
  if (denied) return denied;

  try {
    const { invite, token } = await inviteCompanyUser(session.supabase, {
      tenantId: session.tenantId,
      companyId,
      email: parsed.data.email,
      invitedBy: session.appUserId,
    });

    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "create",
      table: "staff_invite",
      resourceId: invite.id,
      metadata: { event: "company_user_invited", companyId },
    });

    return NextResponse.json({ data: { invite, token } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao convidar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
