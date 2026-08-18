import { NextRequest, NextResponse } from "next/server";
import { representationCreateSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const body = await request.json();
  const parsed = representationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data: establishment, error: establishmentError } = await session.supabase
    .from("establishment")
    .select("id, company:establishment_company_id_tenant_id_fkey(branch_id)")
    .eq("tenant_id", session.tenantId)
    .eq("id", parsed.data.establishmentId)
    .single();
  if (establishmentError || !establishment) {
    return NextResponse.json({ error: "estabelecimento não encontrado" }, { status: 404 });
  }

  const branchId = (establishment.company as unknown as { branch_id: string | null } | null)?.branch_id ?? null;
  const denied = checkPermission(session, "representation.write", { tenantId: session.tenantId, branchId });
  if (denied) return denied;

  const { data, error } = await session.supabase
    .from("union_representation")
    .insert({
      tenant_id: session.tenantId,
      establishment_id: parsed.data.establishmentId,
      union_registration_id: parsed.data.unionRegistrationId ?? null,
      status: parsed.data.status,
      valid_from: parsed.data.validFrom,
      valid_until: parsed.data.validUntil ?? null,
      basis: parsed.data.basis,
      evidence: parsed.data.evidence,
      decided_by: session.appUserId,
      decided_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    const status = error.message.includes("exclude") || error.code === "23P01" ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ data }, { status: 201 });
}
