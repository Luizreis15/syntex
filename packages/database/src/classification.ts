import type { DataClassification } from "@syntex/types";

/**
 * Catálogo declarativo: classificação do dado por tabela (CLAUDE.md #5,
 * "toda tabela e coluna tem classificação"). Nesta fatia a classificação é
 * uniforme por tabela — nenhuma delas mistura colunas de sensibilidades
 * diferentes ainda. Quando isso deixar de ser verdade (ex.: `person` com
 * saúde/jurídico), a exceção some para tabela própria, não vira coluna.
 *
 * Consultado pela aplicação sempre que grava audit_log, para que o log
 * carregue a classificação do dado acessado, não só o nome da tabela —
 * é o que torna respondível "quais titulares e categorias foram expostos"
 * dentro do prazo da ANPD.
 */
export const TABLE_DATA_CLASSIFICATION = {
  municipality: "publico",
  cnae: "publico",
  tenant: "interno",
  branch: "interno",
  app_user: "pessoal",
  permission: "interno",
  role: "interno",
  role_permission: "interno",
  user_role: "interno",
  company: "interno",
  establishment: "interno",
  economic_category: "interno",
  professional_category: "interno",
  union_registration: "juridico",
  union_territory: "interno",
  union_representation: "juridico",
  collective_agreement: "juridico",
  collective_agreement_territory: "interno",
  contribution_rule: "financeiro",
  revenue_plan: "financeiro",
  contribution_assessment: "financeiro",
  obligation: "financeiro",
  charge: "financeiro",
  journal_entry: "financeiro",
  journal_line: "financeiro",
  payment_webhook_event: "financeiro",
  person: "pessoal",
  worker: "pessoal",
  employment_relationship: "pessoal",
  membership: "sensivel",
  office: "interno",
  office_company_link: "interno",
  delegation: "interno",
  department: "interno",
  staff_invite: "pessoal",
  platform_admin: "interno",
  platform_notification: "interno",
} as const satisfies Record<string, DataClassification>;

export type AuditableTable = keyof typeof TABLE_DATA_CLASSIFICATION;

export function classificationOf(table: AuditableTable): DataClassification {
  return TABLE_DATA_CLASSIFICATION[table];
}
