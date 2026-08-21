import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { z } from "zod";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { createDepartment, createStaffInvite } from "@/lib/domain/staff-invite";

const departmentSchema = z.object({
  name: z.string().min(2).max(120),
  branchId: z.string().uuid().optional().nullable(),
});

const inviteSchema = z.object({
  email: z.string().email(),
  roleName: z.enum(["admin", "diretoria", "atendimento", "financeiro", "company_master", "company_user"]),
  scope: z.enum(["own", "branch", "department", "company", "tenant", "global"]),
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "staff.read", { tenantId: session.tenantId });
  if (denied) return denied;

  const [{ data: departments }, { data: invites }] = await Promise.all([
    session.supabase
      .from("department")
      .select("id, name, branch_id, created_at")
      .eq("tenant_id", session.tenantId)
      .order("name"),
    session.supabase
      .from("staff_invite")
      .select("id, email, role_name, scope, branch_id, department_id, expires_at, accepted_at, revoked_at, created_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "staff_invite",
    metadata: { event: "list_staff" },
  });

  return NextResponse.json({
    data: {
      departments: departments ?? [],
      invites: invites ?? [],
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const body = await request.json();
  const kind = body?.kind as string | undefined;

  if (kind === "department") {
    const denied = checkPermission(session, "staff.invite", { tenantId: session.tenantId });
    if (denied) return denied;
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }
    try {
      const department = await createDepartment(session.supabase, {
        tenantId: session.tenantId,
        name: parsed.data.name,
        branchId: parsed.data.branchId,
      });
      return NextResponse.json({ data: department }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "falha ao criar departamento";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (kind === "invite") {
    const denied = checkPermission(session, "staff.invite", { tenantId: session.tenantId });
    if (denied) return denied;
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }
    try {
      const { invite, token } = await createStaffInvite(session.supabase, {
        tenantId: session.tenantId,
        email: parsed.data.email,
        roleName: parsed.data.roleName,
        scope: parsed.data.scope,
        branchId: parsed.data.branchId,
        departmentId: parsed.data.departmentId,
        companyId: parsed.data.companyId,
        invitedBy: session.appUserId,
      });
      // Token em claro só na resposta da criação — não fica no banco.
      return NextResponse.json({ data: { invite, token } }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "falha ao convidar";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "kind inválido (department|invite)" }, { status: 422 });
}
