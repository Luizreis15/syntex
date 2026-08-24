import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { ResolveRepresentationResult } from "@syntex/types";
import { fetchContributionRulesForAgreement, resolveAgreement } from "./resolve-agreement";

type Client = SupabaseClient<Database>;

/**
 * Dado um estabelecimento e uma data, responde qual sindicato o representa,
 * com que status, sob qual CCT, e com base em quê.
 *
 * Nunca escolhe silenciosamente entre representações concorrentes: se mais
 * de uma linha estiver vigente na data, o status vira 'disputada' e todas
 * vão em `conflicts`, sem eleger uma delas como a resposta.
 *
 * CCT / contributionRules só são resolvidos quando a row vigente única está
 * `reconhecida` (estado consolidado — ADR-003 / unicidade sindical). Status
 * reivindicada | disputada | perdida permanecem legíveis (row, basis, evidence)
 * mas não habilitam acordo nem obrigação automática.
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
  const status = representation.status as ResolveRepresentationResult["status"];
  const canResolveOperationalAgreement = status === "reconhecida";

  const agreement = canResolveOperationalAgreement
    ? await findAgreementForRepresentation(
        supabase,
        tenantId,
        establishmentId,
        representation.union_registration_id,
        referenceDate,
      )
    : null;
  const contributionRules = agreement
    ? await fetchContributionRulesForAgreement(supabase, tenantId, agreement.id, referenceDate)
    : [];

  return {
    status,
    representation: representation as unknown as ResolveRepresentationResult["representation"],
    agreement,
    contributionRules,
    basis: representation.basis as ResolveRepresentationResult["basis"],
    evidence: representation.evidence,
    conflicts: [],
  };
}

async function findAgreementForRepresentation(
  supabase: Client,
  tenantId: string,
  establishmentId: string,
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

  const { data: establishment, error: establishmentError } = await supabase
    .from("establishment")
    .select("municipality_id")
    .eq("tenant_id", tenantId)
    .eq("id", establishmentId)
    .single();
  if (establishmentError || !establishment) return null;

  return resolveAgreement(supabase, {
    tenantId,
    economicCategoryId: registration.economic_category_id,
    professionalCategoryId: registration.professional_category_id,
    referenceDate,
    municipalityId: establishment.municipality_id,
  });
}
