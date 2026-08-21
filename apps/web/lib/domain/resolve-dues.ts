import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { CollectiveAgreement, ContributionRule } from "@syntex/types";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";
import { competenceToDate, computeObligationAmount } from "@/lib/domain/obligation";

type Client = SupabaseClient<Database>;

export interface DueItem {
  companyId: string;
  establishmentId: string;
  contributionRuleId: string;
  rule: ContributionRule;
  agreement: CollectiveAgreement | null;
  /** Null quando percentual e base não informada. */
  amount: number | null;
  needsCalculationBase: boolean;
  existingObligationId: string | null;
  existingChargeId: string | null;
  representationStatus: string;
}

/**
 * Dado empresa + competência, responde o que é devido sob as CCTs das
 * representações vigentes nos estabelecimentos (deduplicado por regra).
 */
export async function resolveCompanyDues(
  supabase: Client,
  input: {
    tenantId: string;
    companyId: string;
    competence: string;
    calculationBaseAmount?: number;
  },
): Promise<DueItem[]> {
  const competenceDate = competenceToDate(input.competence);

  const { data: establishments, error: estError } = await supabase
    .from("establishment")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .eq("company_id", input.companyId);
  if (estError) throw estError;
  if (!establishments?.length) return [];

  const byRule = new Map<string, DueItem>();

  for (const est of establishments) {
    const resolution = await resolveRepresentation(
      supabase,
      input.tenantId,
      est.id,
      competenceDate,
    );
    if (resolution.status === "sem_representacao" || resolution.status === "disputada") {
      continue;
    }
    if (!resolution.agreement || resolution.contributionRules.length === 0) continue;

    for (const rule of resolution.contributionRules) {
      if (byRule.has(rule.id)) continue;

      const needsBase = rule.value_type === "percentual";
      let amount: number | null = null;
      try {
        amount = computeObligationAmount(rule, input.calculationBaseAmount);
      } catch {
        amount = null;
      }

      byRule.set(rule.id, {
        companyId: input.companyId,
        establishmentId: est.id,
        contributionRuleId: rule.id,
        rule,
        agreement: resolution.agreement,
        amount,
        needsCalculationBase: needsBase && input.calculationBaseAmount == null,
        existingObligationId: null,
        existingChargeId: null,
        representationStatus: resolution.status,
      });
    }
  }

  const items = [...byRule.values()];
  if (items.length === 0) return items;

  const ruleIds = items.map((i) => i.contributionRuleId);
  const { data: obligations } = await supabase
    .from("obligation")
    .select("id, contribution_rule_id")
    .eq("tenant_id", input.tenantId)
    .eq("company_id", input.companyId)
    .eq("competence", competenceDate)
    .in("contribution_rule_id", ruleIds);

  const obligationByRule = new Map(
    (obligations ?? []).map((o) => [o.contribution_rule_id, o.id]),
  );

  const obligationIds = [...obligationByRule.values()];
  const chargeByObligation = new Map<string, string>();
  if (obligationIds.length > 0) {
    const { data: charges } = await supabase
      .from("charge")
      .select("id, obligation_id")
      .eq("tenant_id", input.tenantId)
      .in("obligation_id", obligationIds);
    for (const c of charges ?? []) {
      chargeByObligation.set(c.obligation_id, c.id);
    }
  }

  for (const item of items) {
    const obId = obligationByRule.get(item.contributionRuleId) ?? null;
    item.existingObligationId = obId;
    item.existingChargeId = obId ? chargeByObligation.get(obId) ?? null : null;
  }

  return items;
}
