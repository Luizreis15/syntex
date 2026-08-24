import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { representationClaimSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { claimRepresentation } from "@/lib/domain/claim-representation";

/**
 * POST /api/representations — command REIVINDICAR.
 * Status é sempre `reivindicada` (servidor). Client não escolhe status.
 */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 422 });
  }

  // Rejeita status/validUntil/decided* se enviados (schema .strict()).
  const parsed = representationClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Escopo: precisa do branch do establishment antes do write.
  const { data: establishment, error: establishmentError } = await session.supabase
    .from("establishment")
    .select("id, company:establishment_company_id_tenant_id_fkey(branch_id)")
    .eq("tenant_id", session.tenantId)
    .eq("id", parsed.data.establishmentId)
    .maybeSingle();
  if (establishmentError || !establishment) {
    return NextResponse.json({ error: "estabelecimento não encontrado" }, { status: 404 });
  }

  const branchId =
    (establishment.company as unknown as { branch_id: string | null } | null)?.branch_id ?? null;
  const denied = checkPermission(session, "representation.write", {
    tenantId: session.tenantId,
    branchId,
  });
  if (denied) return denied;

  const result = await claimRepresentation(
    session.supabase,
    { tenantId: session.tenantId, appUserId: session.appUserId },
    {
      establishmentId: parsed.data.establishmentId,
      unionRegistrationId: parsed.data.unionRegistrationId,
      validFrom: parsed.data.validFrom,
      basis: parsed.data.basis,
      evidence: parsed.data.evidence,
    },
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (!result.duplicate) {
    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "create",
      table: "union_representation",
      resourceId: result.representation.id,
      metadata: {
        surface: "representacao.claim",
        establishmentId: parsed.data.establishmentId,
        companyId: result.companyId,
        status: "reivindicada",
        basis: parsed.data.basis,
        classification: "juridico",
      },
    });
  }

  return NextResponse.json(
    { data: result.representation, duplicate: result.duplicate },
    { status: result.duplicate ? 200 : 201 },
  );
}
