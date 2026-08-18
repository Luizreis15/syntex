import { NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const { data: company, error } = await session.supabase
    .from("company")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .eq("id", params.id)
    .single();
  if (error || !company) return NextResponse.json({ error: "empresa não encontrada" }, { status: 404 });

  const denied = checkPermission(session, "company.read", {
    tenantId: session.tenantId,
    branchId: company.branch_id,
  });
  if (denied) return denied;

  const { data: establishments, error: establishmentsError } = await session.supabase
    .from("establishment")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .eq("company_id", company.id)
    .order("kind");
  if (establishmentsError) return NextResponse.json({ error: establishmentsError.message }, { status: 500 });

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "company",
    resourceId: company.id,
  });

  return NextResponse.json({ data: { company, establishments } });
}
