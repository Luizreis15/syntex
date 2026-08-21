import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { z } from "zod";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { inviteOfficeUser, linkOfficeCompany } from "@/lib/domain/office";

const linkSchema = z.object({
  companyId: z.string().uuid(),
  reason: z.string().min(3),
});

const inviteSchema = z.object({
  email: z.string().email(),
  asMaster: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const body = await request.json();
  const action = body.action as string;
  const officeResource = { tenantId: session.tenantId, officeId: params.id };

  if (action === "link") {
    const denied = checkPermission(session, "office.company.link", officeResource);
    if (denied) return denied;

    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    try {
      const link = await linkOfficeCompany(session.supabase, {
        tenantId: session.tenantId,
        officeId: params.id,
        companyId: parsed.data.companyId,
        reason: parsed.data.reason,
        linkedBy: session.appUserId,
      });

      await recordAudit(session.supabase, {
        tenantId: session.tenantId,
        actorId: session.appUserId,
        action: "create",
        table: "office_company_link",
        resourceId: link.id,
        metadata: { officeId: params.id, companyId: parsed.data.companyId },
      });

      return NextResponse.json({ data: link }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "falha ao vincular";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (action === "invite") {
    const denied = checkPermission(session, "office.user.invite", officeResource);
    if (denied) return denied;

    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    try {
      const { invite, token } = await inviteOfficeUser(session.supabase, {
        tenantId: session.tenantId,
        officeId: params.id,
        email: parsed.data.email,
        invitedBy: session.appUserId,
        asMaster: parsed.data.asMaster,
      });

      await recordAudit(session.supabase, {
        tenantId: session.tenantId,
        actorId: session.appUserId,
        action: "create",
        table: "staff_invite",
        resourceId: invite.id,
        metadata: { officeId: params.id, role: invite.role_name },
      });

      return NextResponse.json({ data: { inviteId: invite.id, inviteToken: token } }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "falha ao convidar";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "action inválida (link|invite)" }, { status: 400 });
}
