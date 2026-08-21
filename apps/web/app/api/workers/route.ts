import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { hasAnyGrant, allowedBranchIds } from "@syntex/permissions";
import { workerCreateSchema } from "@syntex/validation";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { createWorkerWithPerson } from "@/lib/domain/worker";
import { fetchWorkersPage } from "@/features/workers/data";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  if (!hasAnyGrant(session.grants, "worker.read")) {
    return NextResponse.json({ error: "não autorizado" }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const page = Math.max(0, Number(request.nextUrl.searchParams.get("page") ?? "1") - 1);

  const result = await fetchWorkersPage(session.supabase, session.tenantId, session.grants, {
    q,
    pageIndex: page,
    pageSize: 20,
  });

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "worker",
    metadata: { q: q ?? null, count: result.rows.length },
  });

  return NextResponse.json({ data: result });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const body = await request.json();
  const parsed = workerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const denied = checkPermission(session, "worker.write", {
    tenantId: session.tenantId,
    branchId: parsed.data.branchId ?? null,
  });
  if (denied) return denied;

  if (parsed.data.membershipStatus) {
    const membershipDenied = checkPermission(session, "membership.write", {
      tenantId: session.tenantId,
      branchId: parsed.data.branchId ?? null,
    });
    if (membershipDenied) return membershipDenied;
  }

  const branchScope = allowedBranchIds(session.grants, "worker.write");
  if (
    branchScope !== "all" &&
    parsed.data.branchId &&
    !branchScope.includes(parsed.data.branchId)
  ) {
    return NextResponse.json({ error: "unidade fora do escopo" }, { status: 403 });
  }

  try {
    const result = await createWorkerWithPerson(session.supabase, session.tenantId, parsed.data);

    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "create",
      table: "person",
      resourceId: result.person.id,
    });
    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "create",
      table: "worker",
      resourceId: result.worker.id,
    });
    if (result.membership) {
      await recordAudit(session.supabase, {
        tenantId: session.tenantId,
        actorId: session.appUserId,
        action: "create",
        table: "membership",
        resourceId: result.membership.id,
      });
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao criar trabalhador";
    const status = message.includes("duplicate") || message.includes("unique") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
