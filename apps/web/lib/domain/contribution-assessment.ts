import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@syntex/database";
import type { ContributionRule, RevenuePlan } from "@syntex/types";
import { competenceToDate } from "@/lib/domain/obligation";
import {
  calculateContributionAssessment,
  competenceIsWithinPlan,
  resolveObligationParties,
  type AssessmentCalculationInput,
} from "@/lib/domain/revenue-plan";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";

type Client = SupabaseClient<Database>;

export async function createContributionAssessment(
  supabase: Client,
  input: {
    tenantId: string;
    actorId: string;
    revenuePlanId: string;
    companyId: string;
    establishmentId?: string | null;
    competence: string;
    headcount?: number | null;
    headcountSource?: "company_registration" | "finance_confirmed" | "company_declared" | "system_workers" | null;
    categoryFloor?: number | null;
    declaredPayroll?: number | null;
  },
) {
  const competenceDate = competenceToDate(input.competence);

  const [{ data: plan, error: planError }, { data: rule, error: ruleError }, { data: company, error: companyError }] =
    await Promise.all([
      supabase
        .from("revenue_plan")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .eq("id", input.revenuePlanId)
        .single(),
      supabase
        .from("contribution_rule")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .eq("revenue_plan_id", input.revenuePlanId)
        .single(),
      supabase
        .from("company")
        .select("id")
        .eq("tenant_id", input.tenantId)
        .eq("id", input.companyId)
        .single(),
    ]);
  if (planError || !plan) throw new Error("plano de arrecadação não encontrado");
  if (ruleError || !rule) throw new Error("regra de cálculo do plano não encontrada");
  if (companyError || !company) throw new Error("empresa não encontrada");

  const planTyped = plan as unknown as RevenuePlan;
  const ruleTyped = rule as unknown as ContributionRule;
  if (planTyped.status !== "active") throw new Error("o plano precisa estar ativo");
  if (!competenceIsWithinPlan(planTyped, competenceDate)) {
    throw new Error("plano fora da vigência nesta competência");
  }

  if (input.establishmentId) {
    const { data: establishment } = await supabase
      .from("establishment")
      .select("id")
      .eq("tenant_id", input.tenantId)
      .eq("company_id", input.companyId)
      .eq("id", input.establishmentId)
      .maybeSingle();
    if (!establishment) throw new Error("estabelecimento não pertence à empresa");
  }

  if (planTyped.source_type === "collective_agreement") {
    if (!input.establishmentId) {
      throw new Error("selecione o estabelecimento abrangido pela CCT/ACT");
    }
    const resolution = await resolveRepresentation(
      supabase,
      input.tenantId,
      input.establishmentId,
      competenceDate,
    );
    if (resolution.status !== "reconhecida") {
      throw new Error("o estabelecimento precisa ter representação ativa nesta competência");
    }
    if (!resolution.agreement || resolution.agreement.id !== planTyped.collective_agreement_id) {
      throw new Error("a CCT/ACT do plano não é aplicável ao estabelecimento nesta competência");
    }
  }

  const calcInput: AssessmentCalculationInput = {
    headcount: input.headcount,
    categoryFloor: input.categoryFloor,
    declaredPayroll: input.declaredPayroll,
  };
  const calculation = calculateContributionAssessment(ruleTyped, calcInput);
  const snapshot = {
    version: 1,
    plan: {
      id: planTyped.id,
      name: planTyped.name,
      type: planTyped.type,
      source_type: planTyped.source_type,
      collective_agreement_id: planTyped.collective_agreement_id,
      clause_reference: planTyped.clause_reference,
      liable_party: planTyped.liable_party,
      collection_role: planTyped.collection_role,
      audience: planTyped.audience,
      due_day: planTyped.due_day,
    },
    rule: {
      id: ruleTyped.id,
      calculation_method: ruleTyped.calculation_method,
      value: Number(ruleTyped.value),
      value_type: ruleTyped.value_type,
    },
    calculation,
    competence: input.competence,
    computed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("contribution_assessment")
    .insert({
      tenant_id: input.tenantId,
      revenue_plan_id: input.revenuePlanId,
      contribution_rule_id: ruleTyped.id,
      company_id: input.companyId,
      establishment_id: input.establishmentId ?? null,
      competence: competenceDate,
      headcount: calculation.inputs.headcount,
      headcount_source: calculation.inputs.headcount == null ? null : input.headcountSource ?? "finance_confirmed",
      category_floor: calculation.inputs.categoryFloor,
      declared_payroll: calculation.inputs.declaredPayroll,
      unit_amount: calculation.unitAmount,
      amount: calculation.amount,
      calculation_snapshot: snapshot as unknown as Json,
      status: "confirmed",
      created_by: input.actorId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("já existe uma apuração confirmada para esta competência");
    throw error;
  }
  return data;
}

export async function generateChargeFromAssessment(
  supabase: Client,
  input: { tenantId: string; assessmentId: string },
) {
  const { data: assessment, error: assessmentError } = await supabase
    .from("contribution_assessment")
    .select("*, plan:revenue_plan_id(*), rule:contribution_rule_id(*)")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.assessmentId)
    .single();
  if (assessmentError || !assessment) throw new Error("apuração não encontrada");
  if (assessment.status === "cancelled") throw new Error("apuração cancelada não pode gerar cobrança");

  const { data: existing } = await supabase
    .from("obligation")
    .select("id, charge:charge(id)")
    .eq("tenant_id", input.tenantId)
    .eq("assessment_id", assessment.id)
    .maybeSingle();
  if (existing) {
    const charges = existing.charge as unknown as { id: string }[] | null;
    return { obligationId: existing.id, chargeId: charges?.[0]?.id ?? null, created: false };
  }

  const plan = assessment.plan as unknown as RevenuePlan;
  const rule = assessment.rule as unknown as ContributionRule;
  let agreement: {
    id: string;
    kind: string;
    mediador_number: string | null;
    valid_from: string;
    valid_until: string;
    base_date: string;
  } | null = null;
  if (plan.collective_agreement_id) {
    const { data } = await supabase
      .from("collective_agreement")
      .select("id, kind, mediador_number, valid_from, valid_until, base_date")
      .eq("tenant_id", input.tenantId)
      .eq("id", plan.collective_agreement_id)
      .maybeSingle();
    agreement = data;
  }

  const parties = resolveObligationParties(plan, assessment.company_id);
  const assessmentSnapshot = assessment.calculation_snapshot as Record<string, unknown>;
  const ruleSnapshot = {
    rule: {
      id: rule.id,
      name: plan.name,
      type: plan.type,
      calculation_base: rule.calculation_base,
      calculation_method: rule.calculation_method,
      value_type: rule.value_type,
      value: Number(rule.value),
      valid_from: rule.valid_from,
      valid_until: rule.valid_until,
      collective_agreement_id: plan.collective_agreement_id,
    },
    agreement,
    origin: {
      establishment_id: assessment.establishment_id,
      representation_status: plan.source_type === "collective_agreement" ? "reconhecida" : "not_applicable",
    },
    parties,
    assessment: assessmentSnapshot,
    competence: assessment.competence.slice(0, 7),
    calculation_base_amount: assessment.declared_payroll ?? assessment.category_floor,
    computed_at: new Date().toISOString(),
  };

  const { data: obligation, error: obligationError } = await supabase
    .from("obligation")
    .insert({
      tenant_id: input.tenantId,
      company_id: assessment.company_id,
      contribution_rule_id: assessment.contribution_rule_id,
      assessment_id: assessment.id,
      competence: assessment.competence,
      amount: assessment.amount,
      rule_snapshot: ruleSnapshot as unknown as Json,
      status: "cobrada",
      ...parties,
    })
    .select()
    .single();
  if (obligationError) throw obligationError;

  const { data: charge, error: chargeError } = await supabase
    .from("charge")
    .insert({
      tenant_id: input.tenantId,
      obligation_id: obligation.id,
      amount: assessment.amount,
      due_date: dueDateFromCompetence(assessment.competence, plan.due_day),
      status: "pendente",
    })
    .select()
    .single();
  if (chargeError) throw chargeError;

  const { error: statusError } = await supabase
    .from("contribution_assessment")
    .update({ status: "charged" })
    .eq("tenant_id", input.tenantId)
    .eq("id", assessment.id);
  if (statusError) throw statusError;

  return { obligationId: obligation.id, chargeId: charge.id, created: true };
}

function dueDateFromCompetence(competenceDate: string, dueDay: number): string {
  const [year, month] = competenceDate.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month! + 1;
  const nextYear = month === 12 ? year! + 1 : year!;
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;
}
