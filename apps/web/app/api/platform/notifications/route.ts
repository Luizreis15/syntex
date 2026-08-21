import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@syntex/database";
import { z } from "zod";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { createPlatformNotification } from "@/lib/domain/platform-ops";

const createSchema = z.object({
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(2000),
  severity: z.enum(["info", "warning", "critical"]).optional(),
  tenantId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "não autorizado (platform)" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("platform_notification")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "não autorizado (platform)" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "dados inválidos" }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  try {
    const row = await createPlatformNotification(admin, {
      ...parsed.data,
      createdByPlatformAdminId: session.platformAdminId,
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "não autorizado (platform)" }, { status: 403 });
  }

  const body = await request.json();
  const admin = createSupabaseAdminClient();

  if (body.markAllRead === true) {
    const { error } = await admin
      .from("platform_notification")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const id = z.string().uuid().safeParse(body.id);
  if (!id.success) {
    return NextResponse.json({ error: "id inválido" }, { status: 422 });
  }

  const { data, error } = await admin
    .from("platform_notification")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id.data)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
