/**
 * Nomes e planos de workforce fictícios — DEV only.
 * Domínio de e-mail: @exemplo.invalid
 */

import {
  addDaysIso,
  buildActiveHeadcountByCompany,
  createPrng,
  generateDemoCpf,
  hashString,
} from "../lib/seed-generators";

const FIRST_NAMES = [
  "Ana", "Bruno", "Camila", "Diego", "Elisa", "Fábio", "Gabriela", "Henrique",
  "Isabela", "João", "Karina", "Lucas", "Marina", "Nicolas", "Olivia", "Paulo",
  "Queila", "Rafael", "Sofia", "Thiago", "Úrsula", "Vitor", "Wagner", "Yasmin",
  "Amanda", "Caio", "Daniela", "Eduardo", "Fernanda", "Gustavo", "Helena", "Igor",
  "Juliana", "Kevin", "Larissa", "Mateus", "Natália", "Otávio", "Patrícia", "Renato",
  "Sabrina", "Tales", "Valéria", "William", "André", "Beatriz", "Carlos", "Débora",
] as const;

const LAST_NAMES = [
  "Almeida", "Barbosa", "Cardoso", "Dias", "Esteves", "Freitas", "Gomes", "Hahn",
  "Ibrahim", "Junqueira", "Klein", "Lopes", "Mendes", "Nogueira", "Oliveira", "Pinto",
  "Queiroz", "Ribeiro", "Silva", "Teixeira", "Uchoa", "Vieira", "Wagner", "Xavier",
  "Andrade", "Batista", "Campos", "Duarte", "Farias", "Garcia", "Henriques", "Ibrahim",
  "Jesus", "Koch", "Lima", "Moraes", "Nascimento", "Pereira", "Ramos", "Santos",
  "Torres", "Vasconcelos", "Weber", "Zanetti", "Azevedo", "Borges", "Cavalcanti", "Dorneles",
] as const;

const JOB_TITLES = [
  "Vendedor(a)", "Caixa", "Estoquista", "Auxiliar administrativo", "Gerente de loja",
  "Repositor(a)", "Atendente", "Auxiliar de limpeza", "Conferente", "Operador(a) de caixa",
] as const;

export const DEMO_ACTIVE_WORKERS = 1240;
export const DEMO_HISTORICAL_WORKERS = 100;
export const DEMO_ACTIVE_MEMBERSHIPS = 680;
export const DEMO_HISTORICAL_MEMBERSHIPS = 60;

export interface WorkforcePersonPlan {
  index: number;
  fullName: string;
  cpf: string;
  email: string;
  companyIndex: number;
  establishmentKind: "matriz" | "filial";
  branchName: string;
  validFrom: string;
  validUntil: string | null;
  status: "ativo" | "encerrado";
  jobTitle: string;
  withActiveMembership: boolean;
  membershipFrom: string | null;
  historicalMembership: boolean;
}

function demoName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length]!;
  const lastA = LAST_NAMES[(index * 3) % LAST_NAMES.length]!;
  const lastB = LAST_NAMES[(index * 7 + 11) % LAST_NAMES.length]!;
  return `${first} ${lastA} ${lastB}`;
}

function slugEmail(fullName: string, index: number): string {
  const slug = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
  return `${slug}.${String(index).padStart(4, "0")}@exemplo.invalid`;
}

/**
 * Plano completo e determinístico do workforce DEMO.
 * `companyBranchNames[i]` = município/unidade da empresa i.
 * `companyHasFilial[i]` = se a empresa i tem estabelecimento filial.
 */
export function buildWorkforcePlan(input: {
  companyCount: number;
  companyBranchNames: string[];
  companyHasFilial: boolean[];
  referenceDate: string;
}): WorkforcePersonPlan[] {
  const headcounts = buildActiveHeadcountByCompany(input.companyCount, DEMO_ACTIVE_WORKERS);
  const plans: WorkforcePersonPlan[] = [];
  let index = 0;

  for (let companyIndex = 0; companyIndex < input.companyCount; companyIndex++) {
    const n = headcounts[companyIndex] ?? 0;
    for (let k = 0; k < n; k++) {
      const year = 2016 + ((index * 3) % 10);
      const month = String(1 + (index % 12)).padStart(2, "0");
      const day = String(1 + (index % 27)).padStart(2, "0");
      const useFilial = input.companyHasFilial[companyIndex] && index % 5 === 0;
      plans.push({
        index,
        fullName: demoName(index),
        cpf: generateDemoCpf(index),
        email: slugEmail(demoName(index), index),
        companyIndex,
        establishmentKind: useFilial ? "filial" : "matriz",
        branchName: input.companyBranchNames[companyIndex]!,
        validFrom: `${year}-${month}-${day}`,
        validUntil: null,
        status: "ativo",
        jobTitle: JOB_TITLES[index % JOB_TITLES.length]!,
        withActiveMembership: false,
        membershipFrom: null,
        historicalMembership: false,
      });
      index += 1;
    }
  }

  // Marca ~680 filiações ativas entre os ativos (primeiros 680 índices após shuffle determinístico).
  const prng = createPrng(hashString("syntex-demo-membership"));
  const activeIndexes = plans.map((_, i) => i);
  for (let i = activeIndexes.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [activeIndexes[i], activeIndexes[j]] = [activeIndexes[j]!, activeIndexes[i]!];
  }
  const membershipYears = [2017, 2019, 2020, 2022, 2024, 2025, 2026];
  for (let m = 0; m < DEMO_ACTIVE_MEMBERSHIPS && m < activeIndexes.length; m++) {
    const plan = plans[activeIndexes[m]!]!;
    plan.withActiveMembership = true;
    const y = membershipYears[m % membershipYears.length]!;
    plan.membershipFrom = `${y}-0${1 + (m % 9)}-15`;
  }

  // Históricos: vínculos encerrados (pessoas extras).
  for (let h = 0; h < DEMO_HISTORICAL_WORKERS; h++) {
    const idx = index + h;
    const companyIndex = h % input.companyCount;
    const end = addDaysIso(input.referenceDate, -(30 + (h % 800)));
    const startYear = 2014 + (h % 6);
    plans.push({
      index: idx,
      fullName: demoName(idx + 10_000),
      cpf: generateDemoCpf(idx + 10_000),
      email: slugEmail(demoName(idx + 10_000), idx),
      companyIndex,
      establishmentKind: "matriz",
      branchName: input.companyBranchNames[companyIndex]!,
      validFrom: `${startYear}-03-01`,
      validUntil: end,
      status: "encerrado",
      jobTitle: JOB_TITLES[h % JOB_TITLES.length]!,
      withActiveMembership: false,
      membershipFrom: null,
      historicalMembership: h < DEMO_HISTORICAL_MEMBERSHIPS,
    });
  }

  return plans;
}
