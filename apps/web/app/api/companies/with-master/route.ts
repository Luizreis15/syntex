import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { createCompanyWithMaster } from "@/lib/domain/create-company-with-master";

const schema = z.object({
  legalName: z.string().min(2).max(200),
  cnpj: z.string().min(14).max(18),
  tradeName: z.string().max(200).optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  masterEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "company.master.provision", {
    tenantId: session.tenantId,
  });
  if (denied) return denied;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const result = await createCompanyWithMaster(session.supabase, {
      tenantId: session.tenantId,
      legalName: parsed.data.legalName,
      cnpj: parsed.data.cnpj,
      tradeName: parsed.data.tradeName,
      branchId: parsed.data.branchId,
      masterEmail: parsed.data.masterEmail,
      invitedBy: session.appUserId,
    });
    return NextResponse.json(
      {
        data: {
          company: result.company,
          inviteId: result.inviteId,
          inviteToken: result.inviteToken,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao criar empresa+master";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
