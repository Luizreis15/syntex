/**
 * Seed de desenvolvimento/demonstração — tenant SECABC.
 *
 * Todo CNPJ, nome de empresa, número de carta sindical e número de processo
 * abaixo é FICTÍCIO, criado só para exercitar o domínio e demonstrar a
 * densidade real de uma base sindical. Nenhum dado real do SECABC foi usado
 * (não temos acesso a ele nesta fatia). Os CNPJs têm dígito verificador
 * válido (módulo 11) — plausíveis, nunca reais.
 *
 * Roda com service_role (bypassa RLS) porque precisa popular auth.users —
 * nunca use este cliente fora de scripts server-only.
 */
import { createSupabaseAdminClient } from "@syntex/database";
import { PERMISSIONS, ROLE_PERMISSIONS, type RoleName } from "@syntex/permissions";

const supabase = createSupabaseAdminClient();

const ADMIN_EMAIL = "admin@secabc.exemplo.org.br";
const ADMIN_PASSWORD = "syntex-dev-2026!";
const ATENDIMENTO_MAUA_EMAIL = "atendimento.maua@secabc.exemplo.org.br";
const ATENDIMENTO_MAUA_PASSWORD = "syntex-dev-2026!";

async function main() {
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

  const atendimentoMauaUser = await seedUser(
    tenant.id,
    ATENDIMENTO_MAUA_EMAIL,
    ATENDIMENTO_MAUA_PASSWORD,
    "Atendimento Mauá",
  );
  await grantRole(tenant.id, atendimentoMauaUser.appUserId, roles.atendimento, "branch", branches["Mauá"].id);

  console.log("Seed: categorias, registro sindical e CCT");
  const categories = await seedCategories(tenant.id);
  const registration = await seedRegistration(tenant.id, categories, municipalities, branches);
  const rivalRegistration = await seedRivalRegistration(tenant.id, categories);
  const agreements = await seedAgreements(tenant.id, categories);
  await seedContributionRules(tenant.id, agreements);

  console.log("Seed: empresas de exemplo (mínimo 40, densidade real de demonstração)");
  const ctx: CompanySeedContext = { tenantId: tenant.id, branches, municipalities, cnaes, registration, rivalRegistration, decidedBy: adminUser.appUserId };
  const created = await seedCompanies(ctx);

  console.log(`\nSeed concluído. ${created} empresas criadas.`);
  console.log(`Login admin:        ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Login atendimento:  ${ATENDIMENTO_MAUA_EMAIL} / ${ATENDIMENTO_MAUA_PASSWORD} (escopo: Mauá)`);
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
    "contribution_rule",
    "collective_agreement_territory",
    "collective_agreement",
    "union_representation",
    "union_territory",
    "union_registration",
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

async function seedUser(tenantId: string, email: string, password: string, fullName: string) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  let authUserId = existing.users.find((u) => u.email === email)?.id;

  if (!authUserId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    authUserId = data.user.id;
  }

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
  scope: "own" | "branch" | "department" | "tenant" | "global",
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
  ];
  const { data, error } = await supabase.from("collective_agreement").insert(rows).select();
  if (error) throw error;
  return data;
}

async function seedContributionRules(tenantId: string, agreements: { id: string; valid_from: string }[]) {
  const rows = agreements.map((agreement) => ({
    tenant_id: tenantId,
    collective_agreement_id: agreement.id,
    type: "mensalidade" as const,
    valid_from: agreement.valid_from,
    calculation_base: "salário base mensal",
    value_type: "percentual" as const,
    value: 1,
  }));
  const { error } = await supabase.from("contribution_rule").insert(rows);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Empresas — geração em volume para demonstração (mínimo 40, prompt 02 §6)
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

const BRANCH_NAMES = ["Santo André", "Mauá", "São Caetano do Sul", "São Bernardo do Campo", "Diadema"] as const;
const CNAE_CODES = Object.freeze([
  "47.11-3-02",
  "47.21-1-02",
  "47.81-4-00",
  "47.51-2-01",
  "47.53-9-00",
  "47.44-0-05",
  "47.72-5-00",
  "47.89-0-05",
]);

const TRADE_PREFIX = [
  "Mercado",
  "Supermercado",
  "Farmácia",
  "Loja",
  "Comercial",
  "Armarinhos",
  "Papelaria",
  "Ótica",
  "Móveis",
  "Eletro",
  "Confecções",
  "Bazar",
  "Empório",
  "Casa",
  "Distribuidora",
];
const TRADE_NAME = [
  "São Roque",
  "Vitória",
  "Boa Vista",
  "Central",
  "Popular",
  "do ABC",
  "Ipê",
  "Progresso",
  "União",
  "Bom Preço",
  "Estrela",
  "Nova Era",
  "Horizonte",
  "Primavera",
  "Alvorada",
  "Bela Vista",
  "São José",
  "Santa Rita",
  "Real",
  "Modelo",
  "Rio Branco",
  "das Nações",
  "Nova Aliança",
  "Metropolitana",
];

/** CNPJ com dígito verificador válido (módulo 11) — fictício, mas plausível. */
function generateCnpj(sequence: number): string {
  const seqDigits = String(sequence).padStart(8, "0").split("").map(Number);
  const base = [...seqDigits, 0, 0, 0, 1]; // sufixo de filial 0001
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

function tradeNameFor(index: number): string {
  const prefix = TRADE_PREFIX[index % TRADE_PREFIX.length]!;
  const name = TRADE_NAME[Math.floor(index / TRADE_PREFIX.length) % TRADE_NAME.length]!;
  return `${prefix} ${name}`;
}

interface PlanOverrides {
  tradeName: string;
  branchName: (typeof BRANCH_NAMES)[number];
  cnaeCode: string;
  cnpjSeq: number;
}

type PlanEntry = (
  | { kind: "reconhecida-simples"; periods: 1 }
  | { kind: "reconhecida-historico"; periods: 2 | 3 }
  | { kind: "reivindicada" }
  | { kind: "disputada" }
  | { kind: "perdida" }
) & { overrides?: PlanOverrides };

/**
 * Três âncoras nomeadas e reconhecíveis (mesmos três cenários da fatia 1),
 * mais volume gerado para demonstrar densidade real — mínimo 40 no total.
 * Distribuição do volume: ~25 reconhecidas (algumas com histórico), 5
 * reivindicadas, 3 disputadas, 3 perdidas.
 */
function buildPlan(): PlanEntry[] {
  const plan: PlanEntry[] = [
    {
      kind: "reconhecida-simples",
      periods: 1,
      overrides: { tradeName: "Tecidos Ipê", branchName: "Santo André", cnaeCode: "47.81-4-00", cnpjSeq: 1 },
    },
    {
      kind: "reconhecida-historico",
      periods: 3,
      overrides: { tradeName: "Mercado Bom Preço", branchName: "Diadema", cnaeCode: "47.11-3-02", cnpjSeq: 2 },
    },
    {
      kind: "disputada",
      overrides: { tradeName: "Eletroeste", branchName: "São Bernardo do Campo", cnaeCode: "47.53-9-00", cnpjSeq: 3 },
    },
  ];
  for (let i = 0; i < 19; i++) plan.push({ kind: "reconhecida-simples", periods: 1 });
  for (let i = 0; i < 5; i++) plan.push({ kind: "reconhecida-historico", periods: 2 });
  for (let i = 0; i < 3; i++) plan.push({ kind: "reconhecida-historico", periods: 3 });
  for (let i = 0; i < 5; i++) plan.push({ kind: "reivindicada" });
  for (let i = 0; i < 3; i++) plan.push({ kind: "disputada" });
  for (let i = 0; i < 3; i++) plan.push({ kind: "perdida" });
  return plan;
}

async function seedCompanies(ctx: CompanySeedContext): Promise<number> {
  const plan = buildPlan();
  let created = 0;

  for (let i = 0; i < plan.length; i++) {
    const entry = plan[i]!;
    const branchName = entry.overrides?.branchName ?? BRANCH_NAMES[i % BRANCH_NAMES.length]!;
    const cnaeCode = entry.overrides?.cnaeCode ?? CNAE_CODES[i % CNAE_CODES.length]!;
    const cnpj = generateCnpj(entry.overrides ? entry.overrides.cnpjSeq : 20_000_000 + i);
    const tradeName = entry.overrides?.tradeName ?? tradeNameFor(i);
    const legalName = `${tradeName} Comércio Ltda. (fictício)`;

    const { data: company, error: companyError } = await supabase
      .from("company")
      .insert({
        tenant_id: ctx.tenantId,
        branch_id: ctx.branches[branchName]!.id,
        cnpj,
        legal_name: legalName,
        trade_name: tradeName,
        primary_cnae_id: ctx.cnaes[cnaeCode]!.id,
        municipality_id: ctx.municipalities[branchName]!.id,
      })
      .select()
      .single();
    if (companyError) throw companyError;

    const { data: establishment, error: establishmentError } = await supabase
      .from("establishment")
      .insert({
        tenant_id: ctx.tenantId,
        company_id: company.id,
        cnpj,
        kind: "matriz",
        cnae_id: ctx.cnaes[cnaeCode]!.id,
        municipality_id: ctx.municipalities[branchName]!.id,
      })
      .select()
      .single();
    if (establishmentError) throw establishmentError;

    await seedRepresentationFor(ctx, establishment.id, entry);
    created += 1;
  }

  return created;
}

async function seedRepresentationFor(ctx: CompanySeedContext, establishmentId: string, entry: PlanEntry) {
  const decided_at = new Date().toISOString();
  const rows: {
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
  }[] = [];

  switch (entry.kind) {
    case "reconhecida-simples":
      rows.push({
        tenant_id: ctx.tenantId,
        establishment_id: establishmentId,
        union_registration_id: ctx.registration.id,
        status: "reconhecida",
        valid_from: "2019-03-01",
        valid_until: null,
        basis: "cct_registrada",
        evidence: "Representação reconhecida com base na adesão à CCT, sem contestação.",
        decided_by: ctx.decidedBy,
        decided_at,
      });
      break;

    case "reconhecida-historico": {
      const boundaries =
        entry.periods === 2
          ? [
              { from: "2015-01-01", until: "2021-12-31", basis: "manual" as const, evidence: "Cadastro inicial manual na migração da base sindical." },
              { from: "2022-01-01", until: null, basis: "cnae" as const, evidence: "Reenquadramento por atualização do CNAE principal." },
            ]
          : [
              { from: "2012-01-01", until: "2017-12-31", basis: "manual" as const, evidence: "Cadastro inicial manual na migração da base sindical." },
              { from: "2018-01-01", until: "2023-06-30", basis: "cnae" as const, evidence: "Reenquadramento por atualização do CNAE principal." },
              { from: "2023-07-01", until: null, basis: "decisao_judicial" as const, evidence: "Reconhecimento confirmado por decisão judicial fictícia." },
            ];
      for (const period of boundaries) {
        rows.push({
          tenant_id: ctx.tenantId,
          establishment_id: establishmentId,
          union_registration_id: ctx.registration.id,
          status: "reconhecida",
          valid_from: period.from,
          valid_until: period.until,
          basis: period.basis,
          evidence: period.evidence,
          decided_by: ctx.decidedBy,
          decided_at,
        });
      }
      break;
    }

    case "reivindicada":
      rows.push({
        tenant_id: ctx.tenantId,
        establishment_id: establishmentId,
        union_registration_id: ctx.registration.id,
        status: "reivindicada",
        valid_from: "2025-09-01",
        valid_until: null,
        basis: "cnae",
        evidence: "SECABC reivindica representação com base no CNAE de comércio varejista — ainda não reconhecida.",
        decided_by: ctx.decidedBy,
        decided_at,
      });
      break;

    case "disputada":
      rows.push(
        {
          tenant_id: ctx.tenantId,
          establishment_id: establishmentId,
          union_registration_id: ctx.registration.id,
          status: "reivindicada",
          valid_from: "2025-01-01",
          valid_until: null,
          basis: "cnae",
          evidence: "SECABC reivindica representação com base no CNAE de comércio varejista.",
          decided_by: ctx.decidedBy,
          decided_at,
        },
        {
          tenant_id: ctx.tenantId,
          establishment_id: establishmentId,
          union_registration_id: ctx.rivalRegistration.id,
          status: "reivindicada",
          valid_from: "2025-03-01",
          valid_until: null,
          basis: "carta_sindical",
          evidence: "Sindicato rival (fictício) reivindica a mesma base territorial e categoria — disputa em aberto.",
          decided_by: ctx.decidedBy,
          decided_at,
        },
      );
      break;

    case "perdida":
      rows.push({
        tenant_id: ctx.tenantId,
        establishment_id: establishmentId,
        union_registration_id: ctx.registration.id,
        status: "perdida",
        valid_from: "2020-01-01",
        valid_until: null,
        basis: "decisao_judicial",
        evidence: "Representação perdida por decisão judicial fictícia favorável ao sindicato rival.",
        decided_by: ctx.decidedBy,
        decided_at,
      });
      break;
  }

  const { error } = await supabase.from("union_representation").insert(rows);
  if (error) throw error;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
