import { NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@syntex/database";
import { z } from "zod";
import { checkPermission, requireSession } from "@/lib/auth/require-permission";
import { resolveCompanyDues } from "@/lib/domain/resolve-dues";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";

const resolveSchema = z.object({
  companyId: z.string().uuid(),
  competence: z.string().regex(/^\d{4}-\d{2}$/),
  calculationBaseAmount: z.number().nonnegative().optional(),
});

const generateSchema = resolveSchema.extend({
  ruleIds: z.array(z.string().uuid()).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "finance.read", { tenantId: session.tenantId });
  if (denied) return denied;

  const parsed = resolveSchema.safeParse({
    companyId: request.nextUrl.searchParams.get("companyId"),
    competence: request.nextUrl.searchParams.get("competence"),
    calculationBaseAmount: request.nextUrl.searchParams.get("base")
      ? Number(request.nextUrl.searchParams.get("base"))
      : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const dues = await resolveCompanyDues(session.supabase, {
      tenantId: session.tenantId,
      ...parsed.data,
    });

    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "read",
      table: "contribution_rule",
      metadata: { event: "resolve_dues", companyId: parsed.data.companyId, count: dues.length },
    });

    return NextResponse.json({ data: dues });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao resolver débitos";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Gera obrigação+charge para cada débito pendente (ou ruleIds filtrados). */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const denied = checkPermission(session, "finance.write", { tenantId: session.tenantId });
  if (denied) return denied;

  const body = await request.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    let dues = await resolveCompanyDues(session.supabase, {
      tenantId: session.tenantId,
      companyId: parsed.data.companyId,
      competence: parsed.data.competence,
      calculationBaseAmount: parsed.data.calculationBaseAmount,
    });

    if (parsed.data.ruleIds?.length) {
      const set = new Set(parsed.data.ruleIds);
      dues = dues.filter((d) => set.has(d.contributionRuleId));
    }

    const results = [];
    for (const due of dues) {
      if (due.needsCalculationBase) {
        results.push({
          contributionRuleId: due.contributionRuleId,
          error: "base de cálculo obrigatória para regra percentual",
        });
        continue;
      }
      const generated = await generateObligationWithCharge(session.supabase, {
        tenantId: session.tenantId,
        companyId: parsed.data.companyId,
        contributionRuleId: due.contributionRuleId,
        competence: parsed.data.competence,
        calculationBaseAmount: parsed.data.calculationBaseAmount,
      });
      results.push({
        contributionRuleId: due.contributionRuleId,
        obligationId: generated.obligation.id,
        chargeId: generated.charge.id,
        created: generated.created,
        amount: generated.obligation.amount,
      });
    }

    return NextResponse.json({ data: results }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao gerar débitos";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
