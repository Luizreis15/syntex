import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { representationRecognizeSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { recognizeRepresentation } from "@/lib/domain/recognize-representation";

/**
 * POST /api/representations/[id]/recognize — command RECONHECER.
 * Status resultante é sempre `reconhecida` (servidor).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  let body: unknown = {};
  const raw = await request.text();
  if (raw.trim()) {
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 422 });
    }
  }

  const parsed = representationRecognizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data: existing, error: existingError } = await session.supabase
    .from("union_representation")
    .select(
      "id, establishment_id, establishment:union_representation_establishment_id_tenant_id_fkey(company:establishment_company_id_tenant_id_fkey(branch_id))",
    )
    .eq("tenant_id", session.tenantId)
    .eq("id", params.id)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ error: "reivindicação não encontrada" }, { status: 404 });
  }

  const establishment = existing.establishment as unknown as {
    company: { branch_id: string | null } | null;
  } | null;
  const branchId = establishment?.company?.branch_id ?? null;

  const denied = checkPermission(session, "representation.decide", {
    tenantId: session.tenantId,
    branchId,
  });
  if (denied) return denied;

  const result = await recognizeRepresentation(
    session.supabase,
    { tenantId: session.tenantId, appUserId: session.appUserId },
    { representationId: params.id },
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (!result.alreadyRecognized) {
    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "update",
      table: "union_representation",
      resourceId: result.representation.id,
      metadata: {
        surface: "representacao.recognize",
        command: "reconhecer",
        establishmentId: result.establishmentId,
        companyId: result.companyId,
        status: "reconhecida",
        basis: result.representation.basis,
        closedCompetitorIds: result.closedCompetitorIds,
        classification: "juridico",
      },
    });
  }

  return NextResponse.json(
    {
      data: result.representation,
      alreadyRecognized: result.alreadyRecognized,
      closedCompetitorIds: result.closedCompetitorIds,
    },
    { status: 200 },
  );
}
