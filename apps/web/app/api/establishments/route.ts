import { NextRequest, NextResponse } from "next/server";
import { establishmentCreateSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const body = await request.json();
  const parsed = establishmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data: company, error: companyError } = await session.supabase
    .from("company")
    .select("id, branch_id")
    .eq("tenant_id", session.tenantId)
    .eq("id", parsed.data.companyId)
    .single();
  if (companyError || !company) return NextResponse.json({ error: "empresa não encontrada" }, { status: 404 });

  const denied = checkPermission(session, "establishment.write", {
    tenantId: session.tenantId,
    branchId: company.branch_id,
  });
  if (denied) return denied;

  const { data, error } = await session.supabase
    .from("establishment")
    .insert({
      tenant_id: session.tenantId,
      company_id: parsed.data.companyId,
      cnpj: parsed.data.cnpj,
      kind: parsed.data.kind,
      cnae_id: parsed.data.cnaeId ?? null,
      municipality_id: parsed.data.municipalityId ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
