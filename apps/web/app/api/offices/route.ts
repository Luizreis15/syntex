import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { z } from "zod";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { createOfficeWithMaster } from "@/lib/domain/office";

const schema = z.object({
  name: z.string().min(2),
  document: z.string().optional(),
  masterEmail: z.string().email(),
  masterFullName: z.string().min(2),
});

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "office.provision", { tenantId: session.tenantId });
  if (denied) return denied;

  const { data, error } = await session.supabase
    .from("office")
    .select("id, name, document, created_at")
    .eq("tenant_id", session.tenantId)
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "office.provision", { tenantId: session.tenantId });
  if (denied) return denied;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const result = await createOfficeWithMaster(session.supabase, {
      tenantId: session.tenantId,
      name: parsed.data.name,
      document: parsed.data.document,
      masterEmail: parsed.data.masterEmail,
      masterFullName: parsed.data.masterFullName,
      createdBy: session.appUserId,
    });

    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "create",
      table: "office",
      resourceId: result.office.id,
      metadata: { event: "office_provisioned" },
    });

    return NextResponse.json(
      { data: { office: result.office, inviteToken: result.inviteToken } },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao criar escritório";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
