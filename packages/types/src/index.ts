export type Scope =
  | "own"
  | "branch"
  | "department"
  | "company"
  | "office"
  | "tenant"
  | "global";

export type RepresentationStatus =
  | "reivindicada"
  | "reconhecida"
  | "disputada"
  | "perdida";

export type RepresentationBasis =
  | "cnae"
  | "cct_registrada"
  | "decisao_judicial"
  | "carta_sindical"
  | "manual";

export type ContributionRuleType =
  | "assistencial"
  | "confederativa"
  | "mensalidade"
  | "negocial"
  | "sindical"
  | "patronal"
  | "servico"
  | "outro";

export type ContributionCalculationMethod =
  | "floor_headcount_percentage"
  | "declared_payroll_percentage"
  | "fixed_per_worker"
  | "fixed_company";

export type DataClassification =
  | "publico"
  | "interno"
  | "pessoal"
  | "sensivel"
  | "financeiro"
  | "juridico"
  | "saude";

export type MembershipStatus =
  | "prospect"
  | "ativo"
  | "suspenso"
  | "inadimplente"
  | "cancelado"
  | "desfiliado"
  | "falecido";

export interface UnionRepresentation {
  id: string;
  tenant_id: string;
  establishment_id: string;
  union_registration_id: string | null;
  status: RepresentationStatus;
  valid_from: string;
  valid_until: string | null;
  basis: RepresentationBasis;
  evidence: string;
  decided_by: string | null;
  decided_at: string | null;
}

export interface CollectiveAgreement {
  id: string;
  tenant_id: string;
  kind: "cct" | "act";
  mediador_number: string | null;
  valid_from: string;
  valid_until: string;
  base_date: string;
  economic_category_id: string;
  professional_category_id: string;
}

/** Átomo de cálculo (V1: 1:1 com RevenuePlan). */
export interface ContributionRule {
  id: string;
  tenant_id: string;
  revenue_plan_id: string;
  collective_agreement_id: string | null;
  type: ContributionRuleType;
  valid_from: string;
  valid_until: string | null;
  calculation_base: string;
  calculation_method: ContributionCalculationMethod;
  value_type: "percentual" | "valor_fixo";
  value: number;
}

/** Cabeçalho do plano de arrecadação (ADR-023). */
export interface RevenuePlan {
  id: string;
  tenant_id: string;
  name: string;
  type: ContributionRuleType;
  source_type: "collective_agreement" | "assembly" | "statute" | "individual_authorization" | "contract";
  collective_agreement_id: string | null;
  clause_reference: string | null;
  liable_party: "worker" | "member" | "company";
  collection_role: "employer_remittance" | "direct";
  audience: "represented_workers" | "members" | "authorized_workers" | "companies";
  frequency: "monthly" | "single";
  due_day: number;
  opposition_applies: boolean;
  status: "draft" | "active" | "inactive";
  valid_from: string;
  valid_until: string | null;
}

export interface ResolveRepresentationResult {
  status: RepresentationStatus | "sem_representacao";
  representation: UnionRepresentation | null;
  agreement: CollectiveAgreement | null;
  contributionRules: ContributionRule[];
  basis: RepresentationBasis | null;
  evidence: string | null;
  conflicts: UnionRepresentation[];
}
