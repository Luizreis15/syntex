import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@syntex/database";
import { z } from "zod";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { provisionTenantWithMaster } from "@/lib/domain/provision-tenant";

const provisionSchema = z
  .object({
    legalName: z.string().min(2).max(200),
    tradeName: z.string().max(200).optional().nullable(),
    sector: z.string().max(120).optional().nullable(),
    cnpj: z.string().min(14).max(18),
    email: z.string().email().optional().nullable().or(z.literal("")),
    phone: z.string().max(20).optional().nullable(),
    slug: z
      .string()
      .max(64)
      .regex(/^[a-z0-9-]*$/)
      .optional()
      .nullable(),
    masterName: z.string().min(2).max(120),
    masterEmail: z.string().email(),
    masterPassword: z.string().min(6).max(72),
    masterPasswordConfirm: z.string().min(6).max(72),
  })
  .refine((d) => d.masterPassword === d.masterPasswordConfirm, {
    message: "senhas não conferem",
    path: ["masterPasswordConfirm"],
  });

async function requirePlatform() {
  const session = await getPlatformSession();
  if (!session) {
    return { response: NextResponse.json({ error: "não autorizado (platform)" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const auth = await requirePlatform();
  if ("response" in auth) return auth.response;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("tenant")
    .select("id, slug, legal_name, trade_name, sector, cnpj, created_at, default_charge_provider")
    .order("legal_name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatform();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const body = await request.json();
  const parsed = provisionSchema.safeParse(body);
  if (!parsed.success) {
    const first =
      parsed.error.issues[0]?.message ??
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      "dados inválidos";
    return NextResponse.json({ error: first, details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const { masterPasswordConfirm: _, ...data } = parsed.data;
    const result = await provisionTenantWithMaster({
      ...data,
      email: data.email || null,
      invitedByPlatformAdminId: session.platformAdminId,
    });
    return NextResponse.json(
      {
        data: {
          tenant: result.tenant,
          masterEmail: result.masterEmail,
          loginHint: "Entre em /login com o e-mail e a senha do responsável.",
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao provisionar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
