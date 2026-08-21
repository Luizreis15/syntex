import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { CollectiveAgreement, ContributionRule } from "@syntex/types";

type Client = SupabaseClient<Database>;

export interface ResolveAgreementInput {
  tenantId: string;
  economicCategoryId: string;
  professionalCategoryId: string;
  referenceDate: string;
  /** Município do estabelecimento. Null = só casa com CCT sem território restrito. */
  municipalityId: string | null;
}

/**
 * CCT/ACT vigente para o par de categorias na data, filtrada pelo território
 * do estabelecimento.
 *
 * Regra de território:
 * - CCT sem linhas em `collective_agreement_territory` → vale em qualquer município
 * - CCT com território → só se `municipalityId` estiver na lista
 * - Estabelecimento sem município + CCT com território → não casa
 */
export async function resolveAgreement(
  supabase: Client,
  input: ResolveAgreementInput,
): Promise<CollectiveAgreement | null> {
  const { data: candidates, error } = await supabase
    .from("collective_agreement")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("economic_category_id", input.economicCategoryId)
    .eq("professional_category_id", input.professionalCategoryId)
    .lte("valid_from", input.referenceDate)
    .gte("valid_until", input.referenceDate);

  if (error) throw error;
  if (!candidates?.length) return null;

  const agreementIds = candidates.map((a) => a.id);
  const { data: territories, error: territoryError } = await supabase
    .from("collective_agreement_territory")
    .select("collective_agreement_id, municipality_id")
    .eq("tenant_id", input.tenantId)
    .in("collective_agreement_id", agreementIds);
  if (territoryError) throw territoryError;

  const byAgreement = new Map<string, string[]>();
  for (const row of territories ?? []) {
    const list = byAgreement.get(row.collective_agreement_id) ?? [];
    list.push(row.municipality_id);
    byAgreement.set(row.collective_agreement_id, list);
  }

  const match = candidates.find((agreement) => {
    const municipalities = byAgreement.get(agreement.id);
    if (!municipalities || municipalities.length === 0) return true;
    if (!input.municipalityId) return false;
    return municipalities.includes(input.municipalityId);
  });

  return (match as CollectiveAgreement | undefined) ?? null;
}

export async function fetchContributionRulesForAgreement(
  supabase: Client,
  tenantId: string,
  agreementId: string,
  referenceDate: string,
): Promise<ContributionRule[]> {
  const { data, error } = await supabase
    .from("contribution_rule")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("collective_agreement_id", agreementId)
    .lte("valid_from", referenceDate)
    .or(`valid_until.is.null,valid_until.gte.${referenceDate}`);
  if (error) throw error;
  return (data ?? []) as unknown as ContributionRule[];
}
