import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, recordAudit } from "@syntex/database";
import { z } from "zod";
import { getPlatformSession } from "@/lib/auth/platform-session";

const patchSchema = z.object({
  defaultChargeProvider: z.enum(["stub", "asaas", "itau_bolecode"]),
  itauBeneficiarioId: z.string().max(120).nullable().optional(),
  itauPixKey: z.string().max(120).nullable().optional(),
  itauCarteiraCode: z.string().max(20).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "não autorizado (platform)" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  const provider = parsed.data.defaultChargeProvider;
  const clearItau = provider !== "itau_bolecode";

  const { data, error } = await admin
    .from("tenant")
    .update({
      default_charge_provider: provider,
      itau_beneficiario_id: clearItau ? null : parsed.data.itauBeneficiarioId || null,
      itau_pix_key: clearItau ? null : parsed.data.itauPixKey || null,
      itau_carteira_code: clearItau ? null : parsed.data.itauCarteiraCode || null,
    })
    .eq("id", params.id)
    .select(
      "id, slug, legal_name, default_charge_provider, itau_beneficiario_id, itau_pix_key, itau_carteira_code",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await recordAudit(admin, {
    tenantId: params.id,
    actorId: null,
    action: "update",
    table: "tenant",
    resourceId: params.id,
    metadata: {
      portal: "platform",
      by: session.platformAdminId,
      provider,
    },
  });

  return NextResponse.json({ data });
}
