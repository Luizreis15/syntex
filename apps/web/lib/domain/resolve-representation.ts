import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { ResolveRepresentationResult } from "@syntex/types";

type Client = SupabaseClient<Database>;

/**
 * Dado um estabelecimento e uma data, responde qual sindicato o representa,
 * com que status, sob qual CCT, e com base em quê.
 *
 * Nunca escolhe silenciosamente entre representações concorrentes: se mais
 * de uma linha estiver vigente na data, o status vira 'disputada' e todas
 * vão em `conflicts`, sem eleger uma delas como a resposta.
 */
export async function resolveRepresentation(
  supabase: Client,
  tenantId: string,
  establishmentId: string,
  referenceDate: string,
): Promise<ResolveRepresentationResult> {
  const { data: rows, error } = await supabase
    .from("union_representation")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("establishment_id", establishmentId)
    .lte("valid_from", referenceDate)
    .or(`valid_until.is.null,valid_until.gte.${referenceDate}`);

  if (error) throw error;

  const active = rows ?? [];

  if (active.length === 0) {
    return {
      status: "sem_representacao",
      representation: null,
      agreement: null,
      contributionRules: [],
      basis: null,
      evidence: null,
      conflicts: [],
    };
  }

  if (active.length > 1) {
    return {
      status: "disputada",
      representation: null,
      agreement: null,
      contributionRules: [],
      basis: null,
      evidence: null,
      conflicts: active as ResolveRepresentationResult["conflicts"],
    };
  }

  const representation = active[0]!;
  const agreement = await findAgreement(supabase, tenantId, representation.union_registration_id, referenceDate);
  const contributionRules = agreement
    ? await fetchContributionRules(supabase, tenantId, agreement.id, referenceDate)
    : [];

  return {
    status: representation.status as ResolveRepresentationResult["status"],
    representation: representation as unknown as ResolveRepresentationResult["representation"],
    agreement,
    contributionRules,
    basis: representation.basis as ResolveRepresentationResult["basis"],
    evidence: representation.evidence,
    conflicts: [],
  };
}

async function findAgreement(
  supabase: Client,
  tenantId: string,
  unionRegistrationId: string | null,
  referenceDate: string,
): Promise<ResolveRepresentationResult["agreement"]> {
  if (!unionRegistrationId) return null;

  const { data: registration, error: registrationError } = await supabase
    .from("union_registration")
    .select("economic_category_id, professional_category_id")
    .eq("tenant_id", tenantId)
    .eq("id", unionRegistrationId)
    .single();
  if (registrationError || !registration) return null;
  if (!registration.economic_category_id || !registration.professional_category_id) return null;

  const { data: agreement, error: agreementError } = await supabase
    .from("collective_agreement")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("economic_category_id", registration.economic_category_id)
    .eq("professional_category_id", registration.professional_category_id)
    .lte("valid_from", referenceDate)
    .gte("valid_until", referenceDate)
    .maybeSingle();
  if (agreementError || !agreement) return null;

  return agreement as unknown as ResolveRepresentationResult["agreement"];
}

async function fetchContributionRules(
  supabase: Client,
  tenantId: string,
  agreementId: string,
  referenceDate: string,
) {
  const { data, error } = await supabase
    .from("contribution_rule")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("collective_agreement_id", agreementId)
    .lte("valid_from", referenceDate)
    .or(`valid_until.is.null,valid_until.gte.${referenceDate}`);
  if (error) throw error;
  return (data ?? []) as unknown as ResolveRepresentationResult["contributionRules"];
}
