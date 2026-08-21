import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { companyOperationalCreateSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { createCompanyWithMaster } from "@/lib/domain/create-company-with-master";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "company.master.provision", {
    tenantId: session.tenantId,
  });
  if (denied) return denied;

  const body = await request.json();
  const parsed = companyOperationalCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const branchDenied = checkPermission(session, "company.write", {
    tenantId: session.tenantId,
    branchId: parsed.data.branchId ?? null,
  });
  if (branchDenied) return branchDenied;

  try {
    const result = await createCompanyWithMaster(session.supabase, {
      ...parsed.data,
      tenantId: session.tenantId,
      invitedBy: session.appUserId,
    });

    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "create",
      table: "company",
      resourceId: result.company.id,
    });

    return NextResponse.json(
      {
        data: {
          company: result.company,
          establishment: result.establishment,
          inviteId: result.inviteId,
          inviteToken: result.inviteToken,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao criar empresa";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
