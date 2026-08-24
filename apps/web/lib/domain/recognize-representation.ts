import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";

type Client = SupabaseClient<Database>;
type RepresentationRow = Database["public"]["Tables"]["union_representation"]["Row"];

export type RecognizeRepresentationOk = {
  ok: true;
  alreadyRecognized: boolean;
  representation: RepresentationRow;
  closedCompetitorIds: string[];
  companyId: string;
  branchId: string | null;
  establishmentId: string;
};

export type RecognizeRepresentationErr = {
  ok: false;
  status: 404 | 400 | 409 | 422;
  error: string;
};

function dayBefore(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function closeUntil(otherValidFrom: string, beforeRecognizedFrom: string): string {
  // Garante check valid_until >= valid_from.
  return otherValidFrom > beforeRecognizedFrom ? otherValidFrom : beforeRecognizedFrom;
}

function rangesOverlap(
  aFrom: string,
  aUntil: string | null,
  bFrom: string,
  bUntil: string | null,
): boolean {
  const aEnd = aUntil ?? "9999-12-31";
  const bEnd = bUntil ?? "9999-12-31";
  return aFrom <= bEnd && bFrom <= aEnd;
}

/**
 * Command RECONHECER — promove claim `reivindicada` → `reconhecida`.
 * Encerra concorrentes sobrepostos como `perdida` (elege vencedor humano).
 * Não recebe status arbitrário do client.
 */
export async function recognizeRepresentation(
  supabase: Client,
  ctx: { tenantId: string; appUserId: string },
  input: { representationId: string },
): Promise<RecognizeRepresentationOk | RecognizeRepresentationErr> {
  const { data: target, error: targetError } = await supabase
    .from("union_representation")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.representationId)
    .maybeSingle();

  if (targetError) throw targetError;
  if (!target) {
    return { ok: false, status: 404, error: "reivindicação não encontrada" };
  }

  const { data: establishment, error: establishmentError } = await supabase
    .from("establishment")
    .select("id, company_id, company:establishment_company_id_tenant_id_fkey(id, branch_id)")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", target.establishment_id)
    .maybeSingle();

  if (establishmentError) throw establishmentError;
  if (!establishment) {
    return { ok: false, status: 404, error: "estabelecimento não encontrado" };
  }

  const company = establishment.company as unknown as {
    id: string;
    branch_id: string | null;
  } | null;
  const companyId = company?.id ?? establishment.company_id;
  const branchId = company?.branch_id ?? null;

  if (target.status === "reconhecida") {
    return {
      ok: true,
      alreadyRecognized: true,
      representation: target,
      closedCompetitorIds: [],
      companyId,
      branchId,
      establishmentId: target.establishment_id,
    };
  }

  if (target.status !== "reivindicada") {
    return {
      ok: false,
      status: 422,
      error: "somente reivindicação com status reivindicada pode ser reconhecida",
    };
  }

  const { data: siblings, error: siblingsError } = await supabase
    .from("union_representation")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("establishment_id", target.establishment_id)
    .neq("id", target.id);

  if (siblingsError) throw siblingsError;

  const decidedAt = new Date().toISOString();
  const beforeFrom = dayBefore(target.valid_from);
  const closedCompetitorIds: string[] = [];

  const competitors = (siblings ?? []).filter((row) => {
    if (row.status === "perdida") return false;
    return rangesOverlap(
      target.valid_from,
      target.valid_until,
      row.valid_from,
      row.valid_until,
    );
  });

  for (const competitor of competitors) {
    const until = closeUntil(competitor.valid_from, beforeFrom);
    const { error: closeError } = await supabase
      .from("union_representation")
      .update({
        status: "perdida",
        valid_until: until,
        decided_by: ctx.appUserId,
        decided_at: decidedAt,
      })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", competitor.id);

    if (closeError) {
      const conflict =
        closeError.message.includes("exclude") || closeError.code === "23P01";
      return {
        ok: false,
        status: conflict ? 409 : 400,
        error: conflict
          ? "conflito temporal ao encerrar representação concorrente"
          : "não foi possível encerrar reivindicação concorrente",
      };
    }
    closedCompetitorIds.push(competitor.id);
  }

  const { data: recognized, error: recognizeError } = await supabase
    .from("union_representation")
    .update({
      status: "reconhecida",
      decided_by: ctx.appUserId,
      decided_at: decidedAt,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", target.id)
    .select()
    .single();

  if (recognizeError) {
    const conflict =
      recognizeError.message.includes("exclude") || recognizeError.code === "23P01";
    return {
      ok: false,
      status: conflict ? 409 : 400,
      error: conflict
        ? "já existe representação reconhecida vigente neste período"
        : "não foi possível reconhecer a reivindicação",
    };
  }

  return {
    ok: true,
    alreadyRecognized: false,
    representation: recognized,
    closedCompetitorIds,
    companyId,
    branchId,
    establishmentId: target.establishment_id,
  };
}
