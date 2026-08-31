import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { ContributionCalculationMethod, ContributionRule, RevenuePlan } from "@syntex/types";

type Client = SupabaseClient<Database>;

/** Visão achatada plano + regra (UI / apuração). */
export type RevenuePlanView = RevenuePlan &
  Pick<ContributionRule, "calculation_base" | "calculation_method" | "value_type" | "value"> & {
    contribution_rule_id: string;
    agreement: {
      id: string;
      kind: string;
      mediador_number: string | null;
      valid_from: string;
      valid_until: string;
    } | null;
  };

export const REVENUE_PLAN_TYPE_LABEL = {
  assistencial: "Contribuição assistencial",
  negocial: "Contribuição negocial",
  mensalidade: "Mensalidade associativa",
  confederativa: "Contribuição confederativa",
  sindical: "Contribuição sindical",
  patronal: "Contribuição patronal",
  servico: "Serviço",
  outro: "Outra receita",
} as const;

export const CALCULATION_METHOD_LABEL: Record<ContributionCalculationMethod, string> = {
  floor_headcount_percentage: "Piso da categoria × funcionários × percentual",
  declared_payroll_percentage: "Folha declarada × percentual",
  fixed_per_worker: "Valor fixo por funcionário",
  fixed_company: "Valor fixo por empresa",
};

export const SOURCE_TYPE_LABEL = {
  collective_agreement: "CCT ou ACT",
  assembly: "Assembleia",
  statute: "Estatuto",
  individual_authorization: "Autorização individual",
  contract: "Contrato",
} as const;

export const AUDIENCE_LABEL = {
  represented_workers: "Todos os trabalhadores abrangidos",
  members: "Somente associados",
  authorized_workers: "Somente trabalhadores autorizados",
  companies: "Empresas abrangidas",
} as const;

export const LIABLE_PARTY_LABEL = {
  worker: "Trabalhador",
  member: "Associado",
  company: "Empresa",
} as const;

export const COLLECTION_ROLE_LABEL = {
  employer_remittance: "Empresa desconta e repassa",
  direct: "Pagamento direto ao sindicato",
} as const;

export interface AssessmentCalculationInput {
  headcount?: number | null;
  categoryFloor?: number | null;
  declaredPayroll?: number | null;
}

export interface AssessmentCalculation {
  amount: number;
  unitAmount: number | null;
  formula: string;
  inputs: {
    headcount: number | null;
    categoryFloor: number | null;
    declaredPayroll: number | null;
    rateOrValue: number;
  };
}

export function calculateContributionAssessment(
  plan: Pick<ContributionRule, "calculation_method" | "value">,
  input: AssessmentCalculationInput,
): AssessmentCalculation {
  const value = Number(plan.value);
  const headcount = input.headcount ?? null;
  const categoryFloor = input.categoryFloor ?? null;
  const declaredPayroll = input.declaredPayroll ?? null;

  switch (plan.calculation_method) {
    case "floor_headcount_percentage": {
      requirePositive(headcount, "informe a quantidade de funcionários");
      requirePositive(categoryFloor, "informe o piso da categoria");
      const unitAmount = roundMoney((categoryFloor! * value) / 100);
      return {
        amount: roundMoney(unitAmount * headcount!),
        unitAmount,
        formula: `${headcount} × ${categoryFloor!.toFixed(2)} × ${value}%`,
        inputs: { headcount, categoryFloor, declaredPayroll: null, rateOrValue: value },
      };
    }
    case "declared_payroll_percentage": {
      requirePositive(declaredPayroll, "informe o total da folha declarada");
      return {
        amount: roundMoney((declaredPayroll! * value) / 100),
        unitAmount: null,
        formula: `${declaredPayroll!.toFixed(2)} × ${value}%`,
        inputs: { headcount, categoryFloor: null, declaredPayroll, rateOrValue: value },
      };
    }
    case "fixed_per_worker": {
      requirePositive(headcount, "informe a quantidade de funcionários");
      return {
        amount: roundMoney(headcount! * value),
        unitAmount: roundMoney(value),
        formula: `${headcount} × ${value.toFixed(2)}`,
        inputs: { headcount, categoryFloor: null, declaredPayroll: null, rateOrValue: value },
      };
    }
    case "fixed_company":
      return {
        amount: roundMoney(value),
        unitAmount: null,
        formula: value.toFixed(2),
        inputs: { headcount, categoryFloor: null, declaredPayroll: null, rateOrValue: value },
      };
    default:
      throw new Error("método de cálculo não suportado");
  }
}

export function calculationBaseLabel(method: ContributionCalculationMethod): string {
  switch (method) {
    case "floor_headcount_percentage":
      return "piso da categoria por trabalhador";
    case "declared_payroll_percentage":
      return "folha salarial declarada";
    case "fixed_per_worker":
      return "quantidade de trabalhadores";
    case "fixed_company":
      return "empresa";
  }
}

export function valueTypeForMethod(method: ContributionCalculationMethod): "percentual" | "valor_fixo" {
  return method.endsWith("_percentage") ? "percentual" : "valor_fixo";
}

export function competenceIsWithinPlan(
  plan: Pick<RevenuePlan, "valid_from" | "valid_until">,
  competenceDate: string,
): boolean {
  return plan.valid_from <= competenceDate && (!plan.valid_until || plan.valid_until >= competenceDate);
}

/** "YYYY-MM" → "YYYY-MM-01"; inválido → null. */
export function competenceToDateSafe(competence: string): string | null {
  if (!/^\d{4}-\d{2}$/.test(competence)) return null;
  return `${competence}-01`;
}

/** Resolve papéis na obrigação a partir do plano + empresa de contexto. */
export function resolveObligationParties(
  plan: Pick<RevenuePlan, "liable_party" | "collection_role">,
  contextCompanyId: string,
): {
  debtor_kind: "worker" | "member" | "company";
  debtor_company_id: string | null;
  debtor_person_id: string | null;
  remitting_company_id: string | null;
} {
  const remitting =
    plan.collection_role === "employer_remittance" ? contextCompanyId : null;

  if (plan.liable_party === "company") {
    return {
      debtor_kind: "company",
      debtor_company_id: contextCompanyId,
      debtor_person_id: null,
      remitting_company_id: remitting,
    };
  }

  return {
    debtor_kind: plan.liable_party,
    debtor_company_id: null,
    debtor_person_id: null, // V1: apuração agregada sem titular pessoa
    remitting_company_id: remitting,
  };
}

function requirePositive(value: number | null, message: string): asserts value is number {
  if (value == null || !Number.isFinite(value) || value <= 0) throw new Error(message);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function fetchRevenuePlanViews(
  supabase: Client,
  tenantId: string,
  opts?: { activeOnly?: boolean; competence?: string },
): Promise<RevenuePlanView[]> {
  let query = supabase
    .from("revenue_plan")
    .select(
      "*, contribution_rule(*), collective_agreement(id, kind, mediador_number, valid_from, valid_until)",
    )
    .eq("tenant_id", tenantId)
    .order("status")
    .order("name");

  if (opts?.activeOnly) query = query.eq("status", "active");
  if (opts?.competence) {
    const date = `${opts.competence}-01`;
    query = query.lte("valid_from", date).or(`valid_until.is.null,valid_until.gte.${date}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const ruleRaw = row.contribution_rule as unknown;
    const rule = (Array.isArray(ruleRaw) ? ruleRaw[0] : ruleRaw) as ContributionRule | null;
    if (!rule) return [];
    const { contribution_rule: _r, collective_agreement, ...plan } = row as typeof row & {
      contribution_rule: unknown;
      collective_agreement: RevenuePlanView["agreement"];
    };
    return [
      {
        ...(plan as unknown as RevenuePlan),
        contribution_rule_id: rule.id,
        calculation_base: rule.calculation_base,
        calculation_method: rule.calculation_method,
        value_type: rule.value_type,
        value: Number(rule.value),
        agreement: (collective_agreement as RevenuePlanView["agreement"]) ?? null,
      },
    ];
  });
}
