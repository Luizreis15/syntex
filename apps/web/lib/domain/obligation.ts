import type { ContributionRule } from "@syntex/types";

export interface RuleSnapshot {
  rule: {
    id: string;
    type: string;
    calculation_base: string;
    value_type: string;
    value: number;
    valid_from: string;
    valid_until: string | null;
    collective_agreement_id: string;
  };
  agreement: {
    id: string;
    kind: string;
    mediador_number: string | null;
    valid_from: string;
    valid_until: string;
    base_date: string;
  } | null;
  /** Origem sindical no momento da geração (A2) — sem evidence. */
  origin?: {
    establishment_id: string;
    representation_id: string | null;
    representation_status: string;
  } | null;
  competence: string;
  calculation_base_amount: number | null;
  computed_at: string;
}

/** Converte "YYYY-MM" no primeiro dia do mês (date ISO). */
export function competenceToDate(competence: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(competence);
  if (!match) throw new Error(`competência inválida: ${competence}`);
  return `${match[1]}-${match[2]}-01`;
}

export function computeObligationAmount(
  rule: Pick<ContributionRule, "value_type" | "value">,
  calculationBaseAmount?: number,
): number {
  if (rule.value_type === "valor_fixo") {
    return roundMoney(Number(rule.value));
  }
  if (calculationBaseAmount == null) {
    throw new Error("calculationBaseAmount é obrigatório para regra percentual");
  }
  return roundMoney((calculationBaseAmount * Number(rule.value)) / 100);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildRuleSnapshot(input: {
  rule: ContributionRule;
  agreement: RuleSnapshot["agreement"];
  competence: string;
  calculationBaseAmount: number | null;
  origin?: RuleSnapshot["origin"];
}): RuleSnapshot {
  return {
    rule: {
      id: input.rule.id,
      type: input.rule.type,
      calculation_base: input.rule.calculation_base,
      value_type: input.rule.value_type,
      value: Number(input.rule.value),
      valid_from: input.rule.valid_from,
      valid_until: input.rule.valid_until,
      collective_agreement_id: input.rule.collective_agreement_id,
    },
    agreement: input.agreement,
    origin: input.origin ?? null,
    competence: input.competence,
    calculation_base_amount: input.calculationBaseAmount,
    computed_at: new Date().toISOString(),
  };
}
