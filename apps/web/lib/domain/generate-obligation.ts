import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@syntex/database";
import type { ContributionRule } from "@syntex/types";
import {
  buildRuleSnapshot,
  competenceToDate,
  computeObligationAmount,
  type RuleSnapshot,
} from "@/lib/domain/obligation";
import { resolveObligationParties } from "@/lib/domain/revenue-plan";
import { resolveCompanyDues } from "@/lib/domain/resolve-dues";

type Client = SupabaseClient<Database>;

export interface GenerateObligationResult {
  obligation: Database["public"]["Tables"]["obligation"]["Row"];
  charge: Database["public"]["Tables"]["charge"]["Row"];
  created: boolean;
}

/**
 * Gera obrigação da competência + cobrança pendente.
 * Idempotente: se já existir obrigação para empresa+regra+competência, devolve a existente.
 */
export async function generateObligationWithCharge(
  supabase: Client,
  input: {
    tenantId: string;
    companyId: string;
    contributionRuleId: string;
    competence: string;
    calculationBaseAmount?: number;
    dueDate?: string;
  },
): Promise<GenerateObligationResult> {
  const competenceDate = competenceToDate(input.competence);

  const { data: existing, error: existingError } = await supabase
    .from("obligation")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("company_id", input.companyId)
    .eq("contribution_rule_id", input.contributionRuleId)
    .eq("competence", competenceDate)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const { data: charge, error: chargeError } = await supabase
      .from("charge")
      .select("*")
      .eq("tenant_id", input.tenantId)
      .eq("obligation_id", existing.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (chargeError) throw chargeError;
    if (!charge) throw new Error("obrigação existente sem cobrança associada");
    return { obligation: existing, charge, created: false };
  }

  const { data: rule, error: ruleError } = await supabase
    .from("contribution_rule")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.contributionRuleId)
    .single();
  if (ruleError || !rule) throw ruleError ?? new Error("regra não encontrada");

  const ruleTyped = rule as unknown as ContributionRule;
  if (ruleTyped.valid_from > competenceDate) {
    throw new Error("regra ainda não vigente na competência");
  }
  if (ruleTyped.valid_until && ruleTyped.valid_until < competenceDate) {
    throw new Error("regra não vigente na competência");
  }

  const { data: agreement } = rule.collective_agreement_id ? await supabase
    .from("collective_agreement")
    .select("id, kind, mediador_number, valid_from, valid_until, base_date")
    .eq("tenant_id", input.tenantId)
    .eq("id", rule.collective_agreement_id)
    .maybeSingle() : { data: null };

  const amount = computeObligationAmount(ruleTyped, input.calculationBaseAmount);
  const origin = await resolveSnapshotOrigin(supabase, input);
  const snapshot = buildRuleSnapshot({
    rule: ruleTyped,
    agreement: agreement
      ? {
          id: agreement.id,
          kind: agreement.kind,
          mediador_number: agreement.mediador_number,
          valid_from: agreement.valid_from,
          valid_until: agreement.valid_until,
          base_date: agreement.base_date,
        }
      : null,
    competence: input.competence,
    calculationBaseAmount: input.calculationBaseAmount ?? null,
    origin,
  });

  const { data: planRow } = ruleTyped.revenue_plan_id
    ? await supabase
        .from("revenue_plan")
        .select("liable_party, collection_role")
        .eq("tenant_id", input.tenantId)
        .eq("id", ruleTyped.revenue_plan_id)
        .maybeSingle()
    : { data: null };

  const parties = resolveObligationParties(
    planRow ?? { liable_party: "company", collection_role: "direct" },
    input.companyId,
  );

  const { data: obligation, error: obligationError } = await supabase
    .from("obligation")
    .insert({
      tenant_id: input.tenantId,
      company_id: input.companyId,
      contribution_rule_id: input.contributionRuleId,
      competence: competenceDate,
      amount,
      rule_snapshot: snapshot as unknown as Json,
      status: "aberta",
      ...parties,
    })
    .select()
    .single();
  if (obligationError) throw obligationError;

  const dueDate = input.dueDate ?? defaultDueDate(competenceDate);

  const { data: charge, error: chargeError } = await supabase
    .from("charge")
    .insert({
      tenant_id: input.tenantId,
      obligation_id: obligation.id,
      amount,
      due_date: dueDate,
      status: "pendente",
    })
    .select()
    .single();
  if (chargeError) throw chargeError;

  return {
    obligation,
    charge,
    created: true,
  };
}

/** Melhor esforço: amarra a regra à representação reconhecida que a originou. */
async function resolveSnapshotOrigin(
  supabase: Client,
  input: {
    tenantId: string;
    companyId: string;
    contributionRuleId: string;
    competence: string;
    calculationBaseAmount?: number;
  },
): Promise<RuleSnapshot["origin"]> {
  try {
    const dues = await resolveCompanyDues(supabase, {
      tenantId: input.tenantId,
      companyId: input.companyId,
      competence: input.competence,
      calculationBaseAmount: input.calculationBaseAmount,
    });
    const match = dues.find((d) => d.contributionRuleId === input.contributionRuleId);
    if (!match) return null;
    return {
      establishment_id: match.establishmentId,
      representation_id: match.representationId,
      representation_status: match.representationStatus,
    };
  } catch {
    return null;
  }
}

function defaultDueDate(competenceDate: string): string {
  const [y, m] = competenceDate.split("-").map(Number);
  const nextMonth = m === 12 ? 1 : m! + 1;
  const nextYear = m === 12 ? y! + 1 : y!;
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-10`;
}
