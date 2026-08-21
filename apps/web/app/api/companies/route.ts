import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { companyCreateSchema } from "@syntex/validation";
import { allowedBranchIds } from "@syntex/permissions";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  // "Posso ler company.read em algum escopo?" — não `checkPermission` com um
  // resource sem branchId, que negaria sempre quem só tem grant de branch.
  const branchScope = allowedBranchIds(session.grants, "company.read");
  if (branchScope !== "all" && branchScope.length === 0) {
    return NextResponse.json({ error: "não autorizado" }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  let query = session.supabase
    .from("company")
    .select("id, cnpj, legal_name, trade_name, status, branch_id")
    .eq("tenant_id", session.tenantId)
    .order("legal_name")
    .limit(50);
  if (branchScope !== "all") query = query.in("branch_id", branchScope);

  if (q) {
    const digits = q.replace(/\D/g, "");
    query = digits.length >= 3 ? query.ilike("cnpj", `%${digits}%`) : query.ilike("legal_name", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "company",
    metadata: { q: q ?? null, count: data?.length ?? 0 },
  });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const body = await request.json();
  const parsed = companyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const denied = checkPermission(session, "company.write", {
    tenantId: session.tenantId,
    branchId: parsed.data.branchId ?? null,
  });
  if (denied) return denied;

  const { data, error } = await session.supabase
    .from("company")
    .insert({
      tenant_id: session.tenantId,
      branch_id: parsed.data.branchId ?? null,
      cnpj: parsed.data.cnpj,
      legal_name: parsed.data.legalName,
      trade_name: parsed.data.tradeName ?? null,
      primary_cnae_id: parsed.data.primaryCnaeId ?? null,
      municipality_id: parsed.data.municipalityId ?? null,
      phone: parsed.data.phone || null,
      address_street: parsed.data.addressStreet || null,
      address_neighborhood: parsed.data.addressNeighborhood || null,
      address_city: parsed.data.addressCity || null,
      address_state: parsed.data.addressState ?? null,
      address_zip: parsed.data.addressZip ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data }, { status: 201 });
}
