/**
 * Seed de desenvolvimento/demonstração — tenant SECABC.
 *
 * Todo CNPJ, nome de empresa, número de carta sindical, CPF, e-mail e
 * processo abaixo é FICTÍCIO (DEV). Nenhum dado real do SECABC.
 * CNPJs/CPFs: dígito verificador válido (módulo 11), gerados
 * deterministicamente — exclusivamente para DEV.
 *
 * Roda com service_role (bypassa RLS) porque precisa popular auth.users e
 * reconstruir o cenário DEMO — nunca use este cliente fora de scripts
 * server-only. Após o seed, use apenas as contas DEMO impressas no final;
 * estado manual no tenant é descartado no reset.
 */
import { createSupabaseAdminClient } from "@syntex/database";
import { PERMISSIONS, ROLE_PERMISSIONS, type RoleName } from "@syntex/permissions";
import { DEMO_COMPANIES, type Scenario } from "./data/demo-companies";
import { assertSeedEnvironmentAllowed, resolveSeedReferenceDate } from "./lib/seed-safety";
import {
  describeDemoVolumes,
  seedDemoFinance,
  seedDemoWorkforce,
  type SeededCompanyRef,
} from "./seed-demo-workforce";
import { pickAgreementCoveringDate } from "./data/demo-finance";

const ADMIN_EMAIL = "admin@secabc.exemplo.org.br";
const ADMIN_PASSWORD = "syntex-dev-2026!";
const ATENDIMENTO_MAUA_EMAIL = "atendimento.maua@secabc.exemplo.org.br";
const ATENDIMENTO_MAUA_PASSWORD = "syntex-dev-2026!";
const DIRETORIA_EMAIL = "diretoria@secabc.exemplo.org.br";
const DIRETORIA_PASSWORD = "syntex-dev-2026!";
/** C3 — role só financeiro (sem representation.*) para negativos do runbook. */
const FINANCEIRO_EMAIL = "financeiro@secabc.exemplo.org.br";
const FINANCEIRO_PASSWORD = "syntex-dev-2026!";
const PLATFORM_EMAIL = "platform@syntex.exemplo.org.br";
const PLATFORM_PASSWORD = "syntex-dev-2026!";

let supabase: ReturnType<typeof createSupabaseAdminClient>;

async function main() {
  const safety = assertSeedEnvironmentAllowed();
  const referenceDate = resolveSeedReferenceDate();
  const volumes = describeDemoVolumes(DEMO_COMPANIES.length);

  console.log("============================================================");
  console.log("ATENÇÃO: este seed apaga e recria dados DEMO do tenant SECABC neste ambiente.");
  console.log("Após o seed, use apenas as contas DEMO criadas por este script.");
  console.log(`Supabase host: ${safety.supabaseUrlHost}${safety.isRemote ? " (remoto DEV)" : " (local)"}`);
  console.log(`Referência temporal: ${referenceDate}`);
  console.log(
    `Volumes planejados: ${volumes.employmentActive} vínculos ativos, ${volumes.membershipActive} filiações ativas, ${volumes.chargesOpen} cobranças abertas, ${volumes.companies} empresas.`,
  );
  console.log("============================================================");

  supabase = createSupabaseAdminClient();

  console.log("Seed: municípios e CNAEs (referência global)");
  const municipalities = await seedMunicipalities();
  const cnaes = await seedCnaes();

  console.log("Seed: tenant SECABC + unidades");
  const tenant = await upsertTenant();
  await resetTenantData(tenant.id);
  const branches = await seedBranches(tenant.id, municipalities);

  console.log("Seed: catálogo de permissões + roles do tenant");
  await seedPermissionCatalog();
  const roles = await seedRoles(tenant.id);

  console.log("Seed: usuários");
  const adminUser = await seedUser(tenant.id, ADMIN_EMAIL, ADMIN_PASSWORD, "Admin SECABC");
  await grantRole(tenant.id, adminUser.appUserId, roles.admin, "tenant");

  await seedPlatformAdmin();

  const atendimentoMauaUser = await seedUser(
    tenant.id,
    ATENDIMENTO_MAUA_EMAIL,
    ATENDIMENTO_MAUA_PASSWORD,
    "Atendimento Mauá",
  );
  await grantRole(tenant.id, atendimentoMauaUser.appUserId, roles.atendimento, "branch", branches["Mauá"].id);

  // Usuário de demonstração: role de direção, escopo tenant inteiro. Duas
  // roles empilhadas (diretoria + financeiro) para cobrir toda permissão
  // hoje definida — é o login que mostra a sidebar completa (prompt 02.1 §2).
  const diretoriaUser = await seedUser(tenant.id, DIRETORIA_EMAIL, DIRETORIA_PASSWORD, "Diretoria SECABC");
  await grantRole(tenant.id, diretoriaUser.appUserId, roles.diretoria, "tenant");
  await grantRole(tenant.id, diretoriaUser.appUserId, roles.financeiro, "tenant");

  // C3 — financeiro puro (sem representation.read/write/decide) para N7 do runbook.
  const financeiroUser = await seedUser(
    tenant.id,
    FINANCEIRO_EMAIL,
    FINANCEIRO_PASSWORD,
    "Financeiro SECABC",
  );
  await grantRole(tenant.id, financeiroUser.appUserId, roles.financeiro, "tenant");

  console.log("Seed: categorias, registro sindical e CCT");
  const categories = await seedCategories(tenant.id);
  const registration = await seedRegistration(tenant.id, categories, municipalities, branches);
  const rivalRegistration = await seedRivalRegistration(tenant.id, categories);
  const agreements = await seedAgreements(tenant.id, categories);
  const rules = await seedContributionRules(tenant.id, agreements);

  console.log("Seed: empresas de exemplo (lista curada, densidade real de demonstração)");
  const ctx: CompanySeedContext = { tenantId: tenant.id, branches, municipalities, cnaes, registration, rivalRegistration, decidedBy: adminUser.appUserId };
  const companies = await seedCompanies(ctx);

  console.log("Seed: pessoas, trabalhadores, vínculos e filiações (DEMO sintético)");
  const workforce = await seedDemoWorkforce({
    admin: supabase,
    tenantId: tenant.id,
    companies,
    branches,
    municipalities,
    referenceDate,
  });

  const agreementForFinance = pickAgreementCoveringDate(agreements, referenceDate);
  const ruleForFinance = agreementForFinance
    ? rules.find((r) => r.collective_agreement_id === agreementForFinance.id)
    : undefined;
  if (!agreementForFinance || !ruleForFinance) {
    throw new Error(
      `Seed DEMO: nenhuma CCT/regra cobrindo a referência ${referenceDate} (C3 — estender seedAgreements).`,
    );
  }

  console.log("Seed: obrigações e cobranças em aberto (sem conciliação falsa)");
  console.log(
    `  CCT financeira: ${agreementForFinance.mediador_number} (${agreementForFinance.valid_from} → ${agreementForFinance.valid_until})`,
  );
  const finance = await seedDemoFinance({
    admin: supabase,
    tenantId: tenant.id,
    companies,
    rule: ruleForFinance,
    agreement: agreementForFinance,
    referenceDate,
  });

  console.log(`\nSeed concluído.`);
  console.log(`  Empresas:              ${companies.length}`);
  console.log(`  Pessoas/workers:       ${workforce.people}`);
  console.log(`  Vínculos ativos:       ${workforce.activeEmployment}`);
  console.log(`  Filiações ativas:      ${workforce.activeMembership}`);
  console.log(`  Obrigações / cobranças:${finance.obligations} / ${finance.charges}`);
  console.log(`Login admin:        ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Login atendimento:  ${ATENDIMENTO_MAUA_EMAIL} / ${ATENDIMENTO_MAUA_PASSWORD} (escopo: Mauá)`);
  console.log(`Login diretoria:    ${DIRETORIA_EMAIL} / ${DIRETORIA_PASSWORD} (demonstração, permissão ampla)`);
  console.log(`Login financeiro:   ${FINANCEIRO_EMAIL} / ${FINANCEIRO_PASSWORD} (só finance.*; sem representation)`);
  console.log(`Login platform:     ${PLATFORM_EMAIL} / ${PLATFORM_PASSWORD} → /platform`);
}

const ABC_MUNICIPALITIES = [
  { ibge_code: "3547809", name: "Santo André", state_code: "SP" },
  { ibge_code: "3548708", name: "São Bernardo do Campo", state_code: "SP" },
  { ibge_code: "3548500", name: "São Caetano do Sul", state_code: "SP" },
  { ibge_code: "3513801", name: "Diadema", state_code: "SP" },
  { ibge_code: "3529401", name: "Mauá", state_code: "SP" },
  { ibge_code: "3543402", name: "Ribeirão Pires", state_code: "SP" },
  { ibge_code: "3544103", name: "Rio Grande da Serra", state_code: "SP" },
] as const;

const COMMERCE_CNAES = [
  { code: "47.11-3-02", description: "Comércio varejista de mercadorias em geral - supermercados", section: "G" },
  { code: "47.21-1-02", description: "Padaria e confeitaria com predominância de revenda", section: "G" },
  { code: "47.81-4-00", description: "Comércio varejista de artigos do vestuário e acessórios", section: "G" },
  {
    code: "47.51-2-01",
    description: "Comércio varejista especializado de equipamentos e suprimentos de informática",
    section: "G",
  },
  { code: "47.53-9-00", description: "Comércio varejista especializado de eletrodomésticos e equipamentos", section: "G" },
  { code: "47.44-0-05", description: "Comércio varejista de materiais de construção", section: "G" },
  { code: "47.72-5-00", description: "Comércio varejista de cosméticos, produtos de perfumaria e de higiene pessoal", section: "G" },
  { code: "47.89-0-05", description: "Comércio varejista de produtos saneantes domissanitários", section: "G" },
  { code: "47.71-7-01", description: "Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas", section: "G" },
  { code: "45.30-7-03", description: "Comércio a varejo de peças e acessórios novos para veículos automotores", section: "G" },
  {
    code: "47.13-0-02",
    description: "Comércio varejista de mercadorias em geral, com predominância de produtos não alimentícios - lojas de departamentos ou magazines",
    section: "G",
  },
  { code: "47.61-0-03", description: "Comércio varejista de artigos de papelaria", section: "G" },
  { code: "47.22-9-02", description: "Comércio varejista de carnes - açougues", section: "G" },
  { code: "47.74-1-00", description: "Comércio varejista de artigos de óptica", section: "G" },
] as const;

async function seedMunicipalities() {
  const { data, error } = await supabase.from("municipality").upsert(ABC_MUNICIPALITIES as any, {
    onConflict: "ibge_code",
  }).select();
  if (error) throw error;
  return Object.fromEntries(data.map((m) => [m.name, m]));
}

async function seedCnaes() {
  const { data, error } = await supabase.from("cnae").upsert(COMMERCE_CNAES as any, { onConflict: "code" }).select();
  if (error) throw error;
  return Object.fromEntries(data.map((c) => [c.code, c]));
}

async function upsertTenant() {
  const { data, error } = await supabase
    .from("tenant")
    .upsert(
      { slug: "secabc", legal_name: "Sindicato dos Comerciários do ABC", cnpj: "60500000000100" },
      { onConflict: "slug" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Torna o seed re-executável: limpa tudo que pertence ao tenant SECABC
 * (exceto o próprio tenant e as branches, recriadas/atualizadas por
 * upsert) antes de recriar. Sem isso, rodar `db:seed` duas vezes falha em
 * CNPJ duplicado e no EXCLUDE de CCT sobreposta. auth.users nunca é
 * apagado aqui — seedUser reaproveita o usuário existente pelo e-mail.
 */
async function resetTenantData(tenantId: string) {
  const tables = [
    "audit_log",
    "outbox_event",
    "payment_webhook_event",
    "journal_line",
    "journal_entry",
    "charge",
    "obligation",
    "contribution_rule",
    "collective_agreement_territory",
    "collective_agreement",
    "union_representation",
    "union_territory",
    "union_registration",
    "membership",
    "employment_relationship",
    "worker",
    "person",
    "establishment",
    "company",
    "professional_category",
    "economic_category",
    "user_role",
    "role_permission",
    "role",
  ] as const;
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("tenant_id", tenantId);
    if (error) throw error;
  }
}

async function seedBranches(tenantId: string, municipalities: Record<string, { id: string }>) {
  const names = ["Santo André", "Mauá", "São Caetano do Sul", "São Bernardo do Campo", "Diadema"];
  const rows = names.map((name) => ({
    tenant_id: tenantId,
    name,
    municipality_id: municipalities[name]?.id ?? null,
  }));
  const { data, error } = await supabase.from("branch").upsert(rows, { onConflict: "tenant_id,name" }).select();
  if (error) throw error;
  return {
    "Santo André": data.find((b) => b.name === "Santo André")!,
    Mauá: data.find((b) => b.name === "Mauá")!,
    "São Caetano do Sul": data.find((b) => b.name === "São Caetano do Sul")!,
    "São Bernardo do Campo": data.find((b) => b.name === "São Bernardo do Campo")!,
    Diadema: data.find((b) => b.name === "Diadema")!,
  };
}

async function seedPermissionCatalog() {
  const rows = PERMISSIONS.map((key) => ({ key, description: key }));
  const { error } = await supabase.from("permission").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

async function seedRoles(tenantId: string) {
  const roleNames = Object.keys(ROLE_PERMISSIONS) as RoleName[];
  const { data: roleRows, error } = await supabase
    .from("role")
    .upsert(
      roleNames.map((name) => ({ tenant_id: tenantId, name })),
      { onConflict: "tenant_id,name" },
    )
    .select();
  if (error) throw error;

  const { data: permissionRows, error: permissionError } = await supabase.from("permission").select("id, key");
  if (permissionError) throw permissionError;
  const permissionIdByKey: Record<string, string> = Object.fromEntries(
    permissionRows.map((p) => [p.key, p.id]),
  );

  for (const role of roleRows) {
    const keys = ROLE_PERMISSIONS[role.name as RoleName];
    const rows = keys.map((key) => ({
      tenant_id: tenantId,
      role_id: role.id,
      permission_id: permissionIdByKey[key]!,
    }));
    const { error: rpError } = await supabase
      .from("role_permission")
      .upsert(rows, { onConflict: "tenant_id,role_id,permission_id" });
    if (rpError) throw rpError;
  }

  return Object.fromEntries(roleRows.map((r) => [r.name, r])) as unknown as Record<RoleName, { id: string }>;
}

/** listUsers pagina em 50 por default — paginar para reaproveitar Auth existente. */
async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.toLowerCase();
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (found) return found.id;
    if (data.users.length < perPage) return null;
  }
  return null;
}

async function ensureAuthUser(email: string, password: string): Promise<string> {
  const existingId = await findAuthUserIdByEmail(email);
  if (existingId) return existingId;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!error && data.user) return data.user.id;

  // Corrida / paginação: e-mail já existe mas não apareceu na varredura.
  if (error && (error.code === "email_exists" || error.status === 422)) {
    const retryId = await findAuthUserIdByEmail(email);
    if (retryId) return retryId;
  }
  throw error ?? new Error(`Falha ao garantir auth user para ${email}`);
}

async function seedPlatformAdmin() {
  const authUserId = await ensureAuthUser(PLATFORM_EMAIL, PLATFORM_PASSWORD);

  const { error } = await supabase.from("platform_admin").upsert(
    {
      auth_user_id: authUserId,
      email: PLATFORM_EMAIL,
      full_name: "Platform Admin Syntex",
    },
    { onConflict: "auth_user_id" },
  );
  if (error) throw error;
}

async function seedUser(tenantId: string, email: string, password: string, fullName: string) {
  const authUserId = await ensureAuthUser(email, password);

  const { data: appUser, error } = await supabase
    .from("app_user")
    .upsert(
      { tenant_id: tenantId, auth_user_id: authUserId, full_name: fullName, email },
      { onConflict: "tenant_id,auth_user_id" },
    )
    .select()
    .single();
  if (error) throw error;

  return { authUserId, appUserId: appUser.id };
}

async function grantRole(
  tenantId: string,
  appUserId: string,
  role: { id: string },
  scope: "own" | "branch" | "department" | "company" | "tenant" | "global",
  branchId?: string,
) {
  const { error } = await supabase.from("user_role").insert({
    tenant_id: tenantId,
    app_user_id: appUserId,
    role_id: role.id,
    scope,
    branch_id: branchId ?? null,
  });
  if (error && error.code !== "23505") throw error;
}

async function seedCategories(tenantId: string) {
  const { data: economic, error: economicError } = await supabase
    .from("economic_category")
    .insert({ tenant_id: tenantId, name: "Comércio Varejista", description: "Empresas do comércio varejista" })
    .select()
    .single();
  if (economicError) throw economicError;

  const { data: professional, error: professionalError } = await supabase
    .from("professional_category")
    .insert({ tenant_id: tenantId, name: "Comerciários", description: "Trabalhadores no comércio" })
    .select()
    .single();
  if (professionalError) throw professionalError;

  return { economic, professional };
}

async function seedRegistration(
  tenantId: string,
  categories: { economic: { id: string }; professional: { id: string } },
  municipalities: Record<string, { id: string }>,
  branches: Record<string, { id: string }>,
) {
  const { data: registration, error } = await supabase
    .from("union_registration")
    .insert({
      tenant_id: tenantId,
      registry_number: "MTE-046.123/1998 (fictício)",
      registered_at: "1998-03-12",
      economic_category_id: categories.economic.id,
      professional_category_id: categories.professional.id,
      document_reference: "Carta sindical fictícia — dado de exemplo, não usar como referência legal",
    })
    .select()
    .single();
  if (error) throw error;

  const territoryRows = Object.keys(branches).map((name) => ({
    tenant_id: tenantId,
    union_registration_id: registration.id,
    municipality_id: municipalities[name]!.id,
  }));
  const { error: territoryError } = await supabase.from("union_territory").insert(territoryRows);
  if (territoryError) throw territoryError;

  return registration;
}

async function seedRivalRegistration(
  tenantId: string,
  categories: { economic: { id: string }; professional: { id: string } },
) {
  const { data, error } = await supabase
    .from("union_registration")
    .insert({
      tenant_id: tenantId,
      registry_number: "MTE-051.987/2003 (fictício — sindicato rival de exemplo)",
      registered_at: "2003-07-01",
      economic_category_id: categories.economic.id,
      professional_category_id: categories.professional.id,
      document_reference: "Carta sindical fictícia do rival, registrada apenas para ilustrar disputa de base",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function seedAgreements(
  tenantId: string,
  categories: { economic: { id: string }; professional: { id: string } },
) {
  const rows = [
    {
      tenant_id: tenantId,
      kind: "cct" as const,
      mediador_number: "MR018452/2024",
      valid_from: "2024-05-01",
      valid_until: "2025-04-30",
      base_date: "2024-05-01",
      economic_category_id: categories.economic.id,
      professional_category_id: categories.professional.id,
    },
    {
      tenant_id: tenantId,
      kind: "cct" as const,
      mediador_number: "MR021897/2025",
      valid_from: "2025-05-01",
      valid_until: "2026-04-30",
      base_date: "2025-05-01",
      economic_category_id: categories.economic.id,
      professional_category_id: categories.professional.id,
    },
    // C3 — cobre SYNTEX_SEED_REFERENCE_DATE (~2026-08) para dues/aplicabilidade “atuais”.
    {
      tenant_id: tenantId,
      kind: "cct" as const,
      mediador_number: "MR024310/2026",
      valid_from: "2026-05-01",
      valid_until: "2027-04-30",
      base_date: "2026-05-01",
      economic_category_id: categories.economic.id,
      professional_category_id: categories.professional.id,
    },
  ];
  const { data, error } = await supabase.from("collective_agreement").insert(rows).select();
  if (error) throw error;
  return data;
}

async function seedContributionRules(
  tenantId: string,
  agreements: {
    id: string;
    kind: string;
    mediador_number: string | null;
    valid_from: string;
    valid_until: string;
    base_date: string;
  }[],
) {
  const rows = agreements.map((agreement) => ({
    tenant_id: tenantId,
    collective_agreement_id: agreement.id,
    type: "mensalidade" as const,
    valid_from: agreement.valid_from,
    valid_until: agreement.valid_until,
    calculation_base: "salário base mensal",
    value_type: "percentual" as const,
    value: 1,
  }));
  const { data, error } = await supabase.from("contribution_rule").insert(rows).select();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Empresas — lista curada, não gerada por combinação (prompt 02.1 §1)
// ---------------------------------------------------------------------------

interface CompanySeedContext {
  tenantId: string;
  branches: Record<string, { id: string }>;
  municipalities: Record<string, { id: string }>;
  cnaes: Record<string, { id: string }>;
  registration: { id: string };
  rivalRegistration: { id: string };
  decidedBy: string;
}

/**
 * CNPJ com dígito verificador válido (módulo 11), a partir de uma raiz
 * derivada por hash do nome — determinística (o seed é re-executável) e
 * sem padrão sequencial perceptível entre empresas diferentes.
 */
function rootFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) >>> 0;
  }
  return 10_000_000 + (hash % 90_000_000);
}

function generateCnpj(root: number, branchSuffix = 1): string {
  const rootDigits = String(root).padStart(8, "0").split("").map(Number);
  const orderDigits = String(branchSuffix).padStart(4, "0").split("").map(Number);
  const base = [...rootDigits, ...orderDigits];
  const dv1 = calcCnpjCheckDigit(base);
  const dv2 = calcCnpjCheckDigit([...base, dv1]);
  return [...base, dv1, dv2].join("");
}

function calcCnpjCheckDigit(digits: number[]): number {
  const weights = digits.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i]!, 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/** Alguns anos de início plausíveis e variados — não todo mundo começa no mesmo dia. */
const STABLE_START_YEARS = [2007, 2009, 2011, 2013, 2015, 2017];

type RepRow = {
  tenant_id: string;
  establishment_id: string;
  union_registration_id: string;
  status: "reconhecida" | "reivindicada" | "disputada" | "perdida";
  valid_from: string;
  valid_until: string | null;
  basis: "cnae" | "cct_registrada" | "decisao_judicial" | "carta_sindical" | "manual";
  evidence: string;
  decided_by: string;
  decided_at: string;
};

function representationForScenario(
  ctx: CompanySeedContext,
  establishmentId: string,
  scenario: Scenario,
  variant: number,
): RepRow[] {
  const decided_at = new Date().toISOString();
  const base = {
    tenant_id: ctx.tenantId,
    establishment_id: establishmentId,
    decided_by: ctx.decidedBy,
    decided_at,
  };

  switch (scenario) {
    case "stable": {
      const year = STABLE_START_YEARS[variant % STABLE_START_YEARS.length];
      const bases = ["cct_registrada", "carta_sindical", "manual"] as const;
      return [
        {
          ...base,
          union_registration_id: ctx.registration.id,
          status: "reconhecida",
          valid_from: `${year}-03-01`,
          valid_until: null,
          basis: bases[variant % bases.length]!,
          evidence: "Representação reconhecida desde a filiação à base territorial, sem contestação.",
        },
      ];
    }

    case "evolved": {
      const threePeriods = variant % 2 === 0;
      const periods = threePeriods
        ? [
            { from: "2012-01-01", until: "2017-12-31", basis: "manual" as const, evidence: "Cadastro inicial manual na migração da base sindical." },
            { from: "2018-01-01", until: "2023-06-30", basis: "cnae" as const, evidence: "Reenquadramento por atualização do CNAE principal da empresa." },
            { from: "2023-07-01", until: null, basis: "decisao_judicial" as const, evidence: "Reconhecimento confirmado por decisão judicial fictícia." },
          ]
        : [
            { from: "2015-01-01", until: "2021-12-31", basis: "manual" as const, evidence: "Cadastro inicial manual na migração da base sindical." },
            { from: "2022-01-01", until: null, basis: "cnae" as const, evidence: "Reenquadramento por atualização do CNAE principal da empresa." },
          ];
      return periods.map((p) => ({
        ...base,
        union_registration_id: ctx.registration.id,
        status: "reconhecida" as const,
        valid_from: p.from,
        valid_until: p.until,
        basis: p.basis,
        evidence: p.evidence,
      }));
    }

    case "claimed":
      return [
        {
          ...base,
          union_registration_id: ctx.registration.id,
          status: "reivindicada",
          valid_from: "2025-08-01",
          valid_until: null,
          basis: "cnae",
          evidence: "SECABC reivindica representação com base no CNAE — ainda não reconhecida.",
        },
      ];

    case "disputed":
      return [
        {
          ...base,
          union_registration_id: ctx.registration.id,
          status: "reivindicada",
          valid_from: "2025-01-01",
          valid_until: null,
          basis: "cnae",
          evidence: "SECABC reivindica representação com base no CNAE de comércio varejista.",
        },
        {
          ...base,
          union_registration_id: ctx.rivalRegistration.id,
          status: "reivindicada",
          valid_from: "2025-03-01",
          valid_until: null,
          basis: "carta_sindical",
          evidence: "Sindicato rival (fictício) reivindica a mesma base territorial e categoria — disputa em aberto.",
        },
      ];

    case "lost":
      return [
        {
          ...base,
          union_registration_id: ctx.registration.id,
          status: "perdida",
          valid_from: "2021-04-01",
          valid_until: null,
          basis: "decisao_judicial",
          evidence: "Representação perdida por decisão judicial fictícia favorável ao sindicato rival.",
        },
      ];

    case "resolved":
      return [
        {
          ...base,
          union_registration_id: ctx.registration.id,
          status: "reivindicada",
          valid_from: "2019-06-01",
          valid_until: "2022-02-28",
          basis: "cnae",
          evidence: "SECABC reivindicou representação durante o período de disputa com o sindicato rival.",
        },
        {
          ...base,
          union_registration_id: ctx.rivalRegistration.id,
          status: "reivindicada",
          valid_from: "2019-11-01",
          valid_until: "2022-02-28",
          basis: "carta_sindical",
          evidence: "Sindicato rival (fictício) reivindicou a mesma base durante o período de disputa.",
        },
        {
          ...base,
          union_registration_id: ctx.registration.id,
          status: "reconhecida",
          valid_from: "2022-03-01",
          valid_until: null,
          basis: "decisao_judicial",
          evidence: "Disputa resolvida por decisão judicial fictícia — representação reconhecida ao SECABC.",
        },
      ];
  }
}

async function seedCompanies(ctx: CompanySeedContext): Promise<SeededCompanyRef[]> {
  const seeded: SeededCompanyRef[] = [];

  for (let i = 0; i < DEMO_COMPANIES.length; i++) {
    const demo = DEMO_COMPANIES[i]!;
    const root = rootFromSeed(demo.legalName);
    const cnpj = generateCnpj(root, 1);

    const { data: company, error: companyError } = await supabase
      .from("company")
      .insert({
        tenant_id: ctx.tenantId,
        branch_id: ctx.branches[demo.branch]!.id,
        cnpj,
        legal_name: demo.legalName,
        trade_name: demo.tradeName ?? null,
        primary_cnae_id: ctx.cnaes[demo.cnae]!.id,
        municipality_id: ctx.municipalities[demo.branch]!.id,
      })
      .select()
      .single();
    if (companyError) throw companyError;

    const { data: matriz, error: matrizError } = await supabase
      .from("establishment")
      .insert({
        tenant_id: ctx.tenantId,
        company_id: company.id,
        cnpj,
        kind: "matriz",
        cnae_id: ctx.cnaes[demo.cnae]!.id,
        municipality_id: ctx.municipalities[demo.branch]!.id,
      })
      .select()
      .single();
    if (matrizError) throw matrizError;

    const matrizRows = representationForScenario(ctx, matriz.id, demo.scenario, i);
    const { error: repError } = await supabase.from("union_representation").insert(matrizRows);
    if (repError) throw repError;

    let filialEstablishmentId: string | null = null;
    let filialBranchName: string | null = null;
    let filialBranchId: string | null = null;

    if (demo.filial) {
      const filialCnae = demo.filial.cnae ?? demo.cnae;
      const filialCnpj = generateCnpj(root, 2);
      const { data: filial, error: filialError } = await supabase
        .from("establishment")
        .insert({
          tenant_id: ctx.tenantId,
          company_id: company.id,
          cnpj: filialCnpj,
          kind: "filial",
          cnae_id: ctx.cnaes[filialCnae]!.id,
          municipality_id: ctx.municipalities[demo.filial.branch]!.id,
        })
        .select()
        .single();
      if (filialError) throw filialError;

      // A filial resolve de forma independente da matriz — é o ponto que
      // demonstra representação por estabelecimento, não por empresa.
      const filialRows = representationForScenario(ctx, filial.id, "stable", i + 100);
      const { error: filialRepError } = await supabase.from("union_representation").insert(filialRows);
      if (filialRepError) throw filialRepError;

      filialEstablishmentId = filial.id;
      filialBranchName = demo.filial.branch;
      filialBranchId = ctx.branches[demo.filial.branch]!.id;
    }

    seeded.push({
      id: company.id,
      branchName: demo.branch,
      branchId: ctx.branches[demo.branch]!.id,
      matrizEstablishmentId: matriz.id,
      filialEstablishmentId,
      filialBranchName,
      filialBranchId,
    });
  }

  return seeded;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
