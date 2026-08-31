/**
 * Inserção em lote do workforce + financeiro DEMO.
 * CPFs estruturalmente válidos, gerados deterministicamente, exclusivamente para DEV.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { DEMO_COMPANIES } from "./data/demo-companies";
import {
  buildWorkforcePlan,
  DEMO_ACTIVE_MEMBERSHIPS,
  DEMO_ACTIVE_WORKERS,
  DEMO_HISTORICAL_MEMBERSHIPS,
  DEMO_HISTORICAL_WORKERS,
} from "./data/demo-people";
import {
  buildOpenChargePlan,
  competenceYmToDate,
  DEMO_OPEN_CHARGES,
  DEMO_OVERDUE_CHARGES,
  DEMO_PENDING_CHARGES,
} from "./data/demo-finance";
import { addDaysIso } from "./lib/seed-generators";

type Admin = SupabaseClient<Database>;

export interface SeededCompanyRef {
  id: string;
  branchName: string;
  branchId: string;
  matrizEstablishmentId: string;
  filialEstablishmentId: string | null;
  filialBranchName: string | null;
  filialBranchId: string | null;
}

export interface ContributionRuleRef {
  id: string;
  type: string;
  calculation_base: string;
  value_type: string;
  value: number;
  valid_from: string;
  valid_until: string | null;
  collective_agreement_id: string | null;
}

export interface AgreementRef {
  id: string;
  kind: string;
  mediador_number: string | null;
  valid_from: string;
  valid_until: string;
  base_date: string;
}

const CHUNK = 250;

async function insertChunked<T extends Record<string, unknown>>(
  admin: Admin,
  table: "person" | "worker" | "employment_relationship" | "membership" | "obligation" | "charge",
  rows: T[],
): Promise<{ id: string }[]> {
  const out: { id: string }[] = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await admin.from(table).insert(chunk as never).select("id");
    if (error) throw new Error(`${table} insert: ${error.message}`);
    out.push(...(data ?? []));
  }
  return out;
}

export function describeDemoVolumes(companyCount: number) {
  return {
    companies: companyCount,
    people: DEMO_ACTIVE_WORKERS + DEMO_HISTORICAL_WORKERS,
    workers: DEMO_ACTIVE_WORKERS + DEMO_HISTORICAL_WORKERS,
    employmentActive: DEMO_ACTIVE_WORKERS,
    employmentHistorical: DEMO_HISTORICAL_WORKERS,
    membershipActive: DEMO_ACTIVE_MEMBERSHIPS,
    membershipHistorical: DEMO_HISTORICAL_MEMBERSHIPS,
    obligations: DEMO_OPEN_CHARGES,
    chargesOpen: DEMO_OPEN_CHARGES,
    chargesPending: DEMO_PENDING_CHARGES,
    chargesOverdue: DEMO_OVERDUE_CHARGES,
  };
}

export async function seedDemoWorkforce(input: {
  admin: Admin;
  tenantId: string;
  companies: SeededCompanyRef[];
  branches: Record<string, { id: string }>;
  municipalities: Record<string, { id: string }>;
  referenceDate: string;
}): Promise<{ people: number; activeEmployment: number; activeMembership: number }> {
  const { admin, tenantId, companies, municipalities, referenceDate } = input;

  const plans = buildWorkforcePlan({
    companyCount: companies.length,
    companyBranchNames: companies.map((c) => c.branchName),
    companyHasFilial: companies.map((c) => Boolean(c.filialEstablishmentId)),
    referenceDate,
  });

  const personRows = plans.map((p) => {
    const company = companies[p.companyIndex]!;
    const branchName =
      p.establishmentKind === "filial" && company.filialBranchName
        ? company.filialBranchName
        : company.branchName;
    return {
      tenant_id: tenantId,
      cpf: p.cpf,
      full_name: p.fullName,
      email: p.email,
      municipality_id: municipalities[branchName]?.id ?? null,
      data_classification: "pessoal" as const,
    };
  });

  console.log(`  → person (${personRows.length})…`);
  const persons = await insertChunked(admin, "person", personRows);

  const workerRows = plans.map((p, i) => {
    const company = companies[p.companyIndex]!;
    const branchId =
      p.establishmentKind === "filial" && company.filialBranchId
        ? company.filialBranchId
        : company.branchId;
    return {
      tenant_id: tenantId,
      person_id: persons[i]!.id,
      branch_id: branchId,
      registration_number: `DEMO-${String(p.index + 1).padStart(5, "0")}`,
      data_classification: "pessoal" as const,
    };
  });

  console.log(`  → worker (${workerRows.length})…`);
  const workers = await insertChunked(admin, "worker", workerRows);

  const employmentRows = plans.map((p, i) => {
    const company = companies[p.companyIndex]!;
    const establishmentId =
      p.establishmentKind === "filial" && company.filialEstablishmentId
        ? company.filialEstablishmentId
        : company.matrizEstablishmentId;
    return {
      tenant_id: tenantId,
      worker_id: workers[i]!.id,
      company_id: company.id,
      establishment_id: establishmentId,
      valid_from: p.validFrom,
      valid_until: p.validUntil,
      job_title: p.jobTitle,
      status: p.status,
      source: "manual" as const,
      data_classification: "pessoal" as const,
    };
  });

  console.log(`  → employment_relationship (${employmentRows.length})…`);
  await insertChunked(admin, "employment_relationship", employmentRows);

  const membershipRows: Array<{
    tenant_id: string;
    person_id: string;
    status: "ativo" | "desfiliado";
    valid_from: string;
    valid_until: string | null;
    category: string;
    contribution_form: string;
    data_classification: "sensivel";
  }> = [];

  for (let i = 0; i < plans.length; i++) {
    const p = plans[i]!;
    if (p.withActiveMembership && p.membershipFrom) {
      membershipRows.push({
        tenant_id: tenantId,
        person_id: persons[i]!.id,
        status: "ativo",
        valid_from: p.membershipFrom,
        valid_until: null,
        category: "comerciario",
        contribution_form: "desconto_folha",
        data_classification: "sensivel",
      });
    } else if (p.historicalMembership) {
      membershipRows.push({
        tenant_id: tenantId,
        person_id: persons[i]!.id,
        status: "desfiliado",
        valid_from: "2018-06-01",
        valid_until: addDaysIso(referenceDate, -(90 + (i % 400))),
        category: "comerciario",
        contribution_form: "desconto_folha",
        data_classification: "sensivel",
      });
    }
  }

  console.log(`  → membership (${membershipRows.length})…`);
  await insertChunked(admin, "membership", membershipRows);

  return {
    people: persons.length,
    activeEmployment: plans.filter((p) => p.status === "ativo").length,
    activeMembership: membershipRows.filter((m) => m.status === "ativo").length,
  };
}

export async function seedDemoFinance(input: {
  admin: Admin;
  tenantId: string;
  companies: SeededCompanyRef[];
  rule: ContributionRuleRef;
  agreement: AgreementRef;
  referenceDate: string;
}): Promise<{ obligations: number; charges: number }> {
  const { admin, tenantId, companies, rule, agreement, referenceDate } = input;
  const plans = buildOpenChargePlan({
    companyCount: companies.length,
    referenceDate,
    agreementValidFrom: agreement.valid_from,
    agreementValidUntil: agreement.valid_until,
  });

  const obligationRows = plans.map((p) => {
    const company = companies[p.companyIndex]!;
    const calculationBase = p.amount * 100; // regra DEMO 1% → amount
    return {
      tenant_id: tenantId,
      company_id: company.id,
      contribution_rule_id: rule.id,
      debtor_kind: "company" as const,
      debtor_company_id: company.id,
      debtor_person_id: null,
      remitting_company_id: null,
      competence: competenceYmToDate(p.competenceYm),
      amount: p.amount,
      currency: "BRL" as const,
      status: p.obligationStatus,
      data_classification: "financeiro" as const,
      rule_snapshot: {
        rule: {
          id: rule.id,
          type: rule.type,
          calculation_base: rule.calculation_base,
          value_type: rule.value_type,
          value: Number(rule.value),
          valid_from: rule.valid_from,
          valid_until: rule.valid_until,
          collective_agreement_id: rule.collective_agreement_id,
        },
        agreement: {
          id: agreement.id,
          kind: agreement.kind,
          mediador_number: agreement.mediador_number,
          valid_from: agreement.valid_from,
          valid_until: agreement.valid_until,
          base_date: agreement.base_date,
        },
        competence: p.competenceYm,
        calculation_base_amount: calculationBase,
        computed_at: `${referenceDate}T12:00:00.000Z`,
      },
    };
  });

  console.log(`  → obligation (${obligationRows.length})…`);
  const obligations = await insertChunked(admin, "obligation", obligationRows);

  const chargeRows = plans.map((p, i) => ({
    tenant_id: tenantId,
    obligation_id: obligations[i]!.id,
    amount: p.amount,
    due_date: p.dueDate,
    status: p.status,
    data_classification: "financeiro" as const,
  }));

  console.log(`  → charge (${chargeRows.length})…`);
  await insertChunked(admin, "charge", chargeRows);

  return { obligations: obligations.length, charges: chargeRows.length };
}

/** Metadados das empresas curadas — espelha DEMO_COMPANIES na mesma ordem. */
export function demoCompanyMeta() {
  return DEMO_COMPANIES.map((c) => ({
    branchName: c.branch,
    hasFilial: Boolean(c.filial),
    filialBranchName: c.filial?.branch ?? null,
  }));
}
