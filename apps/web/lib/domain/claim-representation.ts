import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { RepresentationBasis } from "@syntex/types";
import { isRepresentationActiveOnDate } from "@/lib/domain/compose-representation-status";

type Client = SupabaseClient<Database>;

export interface ClaimRepresentationInput {
  establishmentId: string;
  unionRegistrationId?: string | null;
  validFrom: string;
  basis: RepresentationBasis;
  evidence: string;
}

export type ClaimRepresentationOk = {
  ok: true;
  duplicate: boolean;
  representation: Database["public"]["Tables"]["union_representation"]["Row"];
  companyId: string;
  branchId: string | null;
};

export type ClaimRepresentationErr = {
  ok: false;
  status: 404 | 400 | 409 | 422;
  error: string;
};

/**
 * Command REIVINDICAR — sempre cria (ou reusa) row com status `reivindicada`.
 * Não encerra rows anteriores; não elege vencedor.
 */
export async function claimRepresentation(
  supabase: Client,
  ctx: { tenantId: string; appUserId: string },
  input: ClaimRepresentationInput,
): Promise<ClaimRepresentationOk | ClaimRepresentationErr> {
  const { data: establishment, error: establishmentError } = await supabase
    .from("establishment")
    .select("id, company_id, company:establishment_company_id_tenant_id_fkey(id, branch_id)")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.establishmentId)
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

  const registrationId = input.unionRegistrationId ?? null;
  if (registrationId) {
    const { data: registration, error: registrationError } = await supabase
      .from("union_registration")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", registrationId)
      .maybeSingle();
    if (registrationError) throw registrationError;
    if (!registration) {
      return { ok: false, status: 422, error: "registro sindical inválido para este tenant" };
    }
  }

  // Duplicidade operacional: reivindicada vigente equivalente (mesmo registro).
  const { data: existingRows, error: existingError } = await supabase
    .from("union_representation")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("establishment_id", input.establishmentId)
    .eq("status", "reivindicada");
  if (existingError) throw existingError;

  const equivalent = (existingRows ?? []).find((row) => {
    if (!isRepresentationActiveOnDate(row.valid_from, row.valid_until, input.validFrom)) {
      return false;
    }
    const rowReg = row.union_registration_id;
    if (registrationId == null) return rowReg == null;
    return rowReg === registrationId;
  });

  if (equivalent) {
    return {
      ok: true,
      duplicate: true,
      representation: equivalent,
      companyId,
      branchId,
    };
  }

  const { data, error } = await supabase
    .from("union_representation")
    .insert({
      tenant_id: ctx.tenantId,
      establishment_id: input.establishmentId,
      union_registration_id: registrationId,
      status: "reivindicada",
      valid_from: input.validFrom,
      valid_until: null,
      basis: input.basis,
      evidence: input.evidence,
      decided_by: ctx.appUserId,
      decided_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    const conflict = error.message.includes("exclude") || error.code === "23P01";
    return {
      ok: false,
      status: conflict ? 409 : 400,
      error: conflict
        ? "conflito com representação reconhecida vigente"
        : "não foi possível registrar a reivindicação",
    };
  }

  return {
    ok: true,
    duplicate: false,
    representation: data,
    companyId,
    branchId,
  };
}
