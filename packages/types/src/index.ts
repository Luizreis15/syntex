export type Scope = "own" | "branch" | "department" | "tenant" | "global";

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
  | "negocial";

export type DataClassification =
  | "publico"
  | "interno"
  | "pessoal"
  | "sensivel"
  | "financeiro"
  | "juridico"
  | "saude";

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

export interface ContributionRule {
  id: string;
  tenant_id: string;
  collective_agreement_id: string;
  type: ContributionRuleType;
  valid_from: string;
  valid_until: string | null;
  calculation_base: string;
  value_type: "percentual" | "valor_fixo";
  value: number;
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
