/**
 * Seed de desenvolvimento — tenant SECABC.
 *
 * Todo CNPJ, nome de empresa, número de carta sindical e número de processo
 * abaixo é FICTÍCIO, criado só para exercitar o domínio. Nenhum dado real do
 * SECABC foi usado (não temos acesso a ele nesta fatia).
 *
 * Roda com service_role (bypassa RLS) porque precisa popular auth.users e
 * gravar em mais de um tenant potencialmente — nunca use este cliente fora
 * de scripts server-only.
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
  await grantRole(tenant.id, atendimentoMauaUser.appUserId, roles.atendimento, "branch", branches["Mauá"]!.id);

  console.log("Seed: categorias, registro sindical e CCT");
  const categories = await seedCategories(tenant.id);
  const registration = await seedRegistration(tenant.id, categories, municipalities, branches);
  const rivalRegistration = await seedRivalRegistration(tenant.id, categories);
  const agreements = await seedAgreements(tenant.id, categories);
  await seedContributionRules(tenant.id, agreements);

  console.log("Seed: empresas de exemplo");
  await seedCompanyRepresentacaoLimpa(tenant.id, branches, municipalities, cnaes, registration, adminUser.appUserId);
  await seedCompanyHistoricoMudanca(tenant.id, branches, municipalities, cnaes, registration, adminUser.appUserId);
  await seedCompanyDisputada(
    tenant.id,
    branches,
    municipalities,
    cnaes,
    registration,
    rivalRegistration,
    adminUser.appUserId,
  );

  console.log("\nSeed concluído.");
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
  // Registro de um sindicato rival fictício, mantido pelo próprio tenant
  // SECABC como evidência de uma disputa de base territorial.
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
      mediador_number: "MED-2024-000456 (fictício)",
      valid_from: "2024-05-01",
      valid_until: "2025-04-30",
      base_date: "2024-05-01",
      economic_category_id: categories.economic.id,
      professional_category_id: categories.professional.id,
    },
    {
      tenant_id: tenantId,
      kind: "cct" as const,
      mediador_number: "MED-2026-000123 (fictício)",
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

async function seedCompanyRepresentacaoLimpa(
  tenantId: string,
  branches: Record<string, { id: string }>,
  municipalities: Record<string, { id: string }>,
  cnaes: Record<string, { id: string }>,
  registration: { id: string },
  decidedBy: string,
) {
  const { data: company, error } = await supabase
    .from("company")
    .insert({
      tenant_id: tenantId,
      branch_id: branches["Santo André"]!.id,
      cnpj: "11222333000181",
      legal_name: "Comércio de Tecidos Ipê Ltda (fictício)",
      trade_name: "Tecidos Ipê",
      primary_cnae_id: cnaes["47.81-4-00"]!.id,
      municipality_id: municipalities["Santo André"]!.id,
    })
    .select()
    .single();
  if (error) throw error;

  const { data: establishment, error: establishmentError } = await supabase
    .from("establishment")
    .insert({
      tenant_id: tenantId,
      company_id: company.id,
      cnpj: "11222333000181",
      kind: "matriz",
      cnae_id: cnaes["47.81-4-00"]!.id,
      municipality_id: municipalities["Santo André"]!.id,
    })
    .select()
    .single();
  if (establishmentError) throw establishmentError;

  const { data: filial, error: filialError } = await supabase
    .from("establishment")
    .insert({
      tenant_id: tenantId,
      company_id: company.id,
      cnpj: "11222333000262",
      kind: "filial",
      cnae_id: cnaes["47.81-4-00"]!.id,
      municipality_id: municipalities["São Caetano do Sul"]!.id,
    })
    .select()
    .single();
  if (filialError) throw filialError;

  const rows = [
    {
      tenant_id: tenantId,
      establishment_id: establishment.id,
      union_registration_id: registration.id,
      status: "reconhecida" as const,
      valid_from: "2020-01-01",
      valid_until: null,
      basis: "cct_registrada" as const,
      evidence: "Representação reconhecida desde a adesão à CCT registrada em 2020, sem contestação.",
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    },
    {
      tenant_id: tenantId,
      establishment_id: filial.id,
      union_registration_id: registration.id,
      status: "reconhecida" as const,
      valid_from: "2021-06-01",
      valid_until: null,
      basis: "cnae" as const,
      evidence: "Filial de São Caetano do Sul, mesmo CNAE da matriz, enquadrada na mesma base territorial.",
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    },
  ];
  const { error: repError } = await supabase.from("union_representation").insert(rows);
  if (repError) throw repError;
}

async function seedCompanyHistoricoMudanca(
  tenantId: string,
  branches: Record<string, { id: string }>,
  municipalities: Record<string, { id: string }>,
  cnaes: Record<string, { id: string }>,
  registration: { id: string },
  decidedBy: string,
) {
  const { data: company, error } = await supabase
    .from("company")
    .insert({
      tenant_id: tenantId,
      branch_id: branches["Diadema"]!.id,
      cnpj: "22333444000195",
      legal_name: "Mercado Bom Preço Diadema Ltda (fictício)",
      trade_name: "Mercado Bom Preço",
      primary_cnae_id: cnaes["47.11-3-02"]!.id,
      municipality_id: municipalities["Diadema"]!.id,
    })
    .select()
    .single();
  if (error) throw error;

  const { data: establishment, error: establishmentError } = await supabase
    .from("establishment")
    .insert({
      tenant_id: tenantId,
      company_id: company.id,
      cnpj: "22333444000195",
      kind: "matriz",
      cnae_id: cnaes["47.11-3-02"]!.id,
      municipality_id: municipalities["Diadema"]!.id,
    })
    .select()
    .single();
  if (establishmentError) throw establishmentError;

  const rows = [
    {
      tenant_id: tenantId,
      establishment_id: establishment.id,
      union_registration_id: registration.id,
      status: "reconhecida" as const,
      valid_from: "2016-01-01",
      valid_until: "2018-12-31",
      basis: "manual" as const,
      evidence: "Cadastro inicial manual na migração da base sindical em 2016.",
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    },
    {
      tenant_id: tenantId,
      establishment_id: establishment.id,
      union_registration_id: registration.id,
      status: "reconhecida" as const,
      valid_from: "2019-01-01",
      valid_until: "2023-12-31",
      basis: "cnae" as const,
      evidence: "Reenquadramento por atualização do CNAE principal da empresa em 2019.",
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    },
    {
      tenant_id: tenantId,
      establishment_id: establishment.id,
      union_registration_id: registration.id,
      status: "reconhecida" as const,
      valid_from: "2024-01-01",
      valid_until: null,
      basis: "decisao_judicial" as const,
      evidence: "Reconhecimento confirmado por decisão judicial fictícia (processo nº 0001234-56.2023.5.02.0032).",
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    },
  ];
  const { error: repError } = await supabase.from("union_representation").insert(rows);
  if (repError) throw repError;
}

async function seedCompanyDisputada(
  tenantId: string,
  branches: Record<string, { id: string }>,
  municipalities: Record<string, { id: string }>,
  cnaes: Record<string, { id: string }>,
  registration: { id: string },
  rivalRegistration: { id: string },
  decidedBy: string,
) {
  const { data: company, error } = await supabase
    .from("company")
    .insert({
      tenant_id: tenantId,
      branch_id: branches["São Bernardo do Campo"]!.id,
      cnpj: "33444555000109",
      legal_name: "Eletroeste Comércio de Eletrônicos S.A. (fictício)",
      trade_name: "Eletroeste",
      primary_cnae_id: cnaes["47.53-9-00"]!.id,
      municipality_id: municipalities["São Bernardo do Campo"]!.id,
    })
    .select()
    .single();
  if (error) throw error;

  const { data: establishment, error: establishmentError } = await supabase
    .from("establishment")
    .insert({
      tenant_id: tenantId,
      company_id: company.id,
      cnpj: "33444555000109",
      kind: "matriz",
      cnae_id: cnaes["47.53-9-00"]!.id,
      municipality_id: municipalities["São Bernardo do Campo"]!.id,
    })
    .select()
    .single();
  if (establishmentError) throw establishmentError;

  const rows = [
    {
      tenant_id: tenantId,
      establishment_id: establishment.id,
      union_registration_id: registration.id,
      status: "reivindicada" as const,
      valid_from: "2025-01-01",
      valid_until: null,
      basis: "cnae" as const,
      evidence: "SECABC reivindica representação com base no CNAE de comércio varejista de eletrônicos.",
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    },
    {
      tenant_id: tenantId,
      establishment_id: establishment.id,
      union_registration_id: rivalRegistration.id,
      status: "reivindicada" as const,
      valid_from: "2025-03-01",
      valid_until: null,
      basis: "carta_sindical" as const,
      evidence: "Sindicato rival (fictício) reivindica a mesma base territorial e categoria — disputa em aberto.",
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    },
  ];
  const { error: repError } = await supabase.from("union_representation").insert(rows);
  if (repError) throw repError;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
