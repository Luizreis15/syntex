import { createSupabaseAdminClient, type Database } from "@syntex/database";
import { PERMISSIONS, ROLE_PERMISSIONS, type RoleName } from "@syntex/permissions";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function ensurePermissionCatalog() {
  const admin = createSupabaseAdminClient();
  const rows = PERMISSIONS.map((key) => ({ key, description: key }));
  const { error } = await admin.from("permission").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

async function seedTenantRoles(tenantId: string) {
  const admin = createSupabaseAdminClient();
  const roleNames = Object.keys(ROLE_PERMISSIONS) as RoleName[];
  for (const name of roleNames) {
    const { error } = await admin
      .from("role")
      .upsert({ tenant_id: tenantId, name }, { onConflict: "tenant_id,name" });
    if (error) throw error;
  }

  const { data: roles, error: rolesError } = await admin
    .from("role")
    .select("id, name")
    .eq("tenant_id", tenantId);
  if (rolesError) throw rolesError;

  const { data: permissions, error: permError } = await admin.from("permission").select("id, key");
  if (permError) throw permError;
  const permissionIdByKey = Object.fromEntries((permissions ?? []).map((p) => [p.key, p.id]));

  for (const role of roles ?? []) {
    const keys = ROLE_PERMISSIONS[role.name as RoleName] ?? [];
    const rows = keys
      .filter((key) => permissionIdByKey[key])
      .map((key) => ({
        tenant_id: tenantId,
        role_id: role.id,
        permission_id: permissionIdByKey[key]!,
      }));
    if (rows.length === 0) continue;
    const { error } = await admin
      .from("role_permission")
      .upsert(rows, { onConflict: "tenant_id,role_id,permission_id" });
    if (error) throw error;
  }
}

export interface ProvisionTenantInput {
  legalName: string;
  tradeName?: string | null;
  sector?: string | null;
  cnpj: string;
  email?: string | null;
  phone?: string | null;
  slug?: string | null;
  masterName: string;
  masterEmail: string;
  masterPassword: string;
  invitedByPlatformAdminId: string;
}

/**
 * Provisiona sindicato + union master já com login/senha (padrão Veramo).
 * O master entra em /login e cai no backoffice do tenant.
 */
export async function provisionTenantWithMaster(input: ProvisionTenantInput): Promise<{
  tenant: Database["public"]["Tables"]["tenant"]["Row"];
  masterEmail: string;
  appUserId: string;
}> {
  const admin = createSupabaseAdminClient();
  const cnpj = input.cnpj.replace(/\D/g, "");
  if (cnpj.length !== 14) throw new Error("CNPJ deve ter 14 dígitos");

  const slugBase = (input.slug?.trim() || slugify(input.tradeName || input.legalName) || "sindicato").toLowerCase();
  const slug = slugBase.replace(/[^a-z0-9-]/g, "").slice(0, 64);
  if (slug.length < 2) throw new Error("slug inválido — informe um identificador curto");

  const masterEmail = input.masterEmail.trim().toLowerCase();
  if (input.masterPassword.length < 6) throw new Error("senha do master: mínimo 6 caracteres");

  await ensurePermissionCatalog();

  const { data: existingSlug } = await admin.from("tenant").select("id").eq("slug", slug).maybeSingle();
  if (existingSlug) throw new Error(`slug "${slug}" já existe — escolha outro identificador`);

  const { data: existingCnpj } = await admin.from("tenant").select("id").eq("cnpj", cnpj).maybeSingle();
  if (existingCnpj) throw new Error("CNPJ já cadastrado em outro sindicato");

  const { data: tenant, error: tenantError } = await admin
    .from("tenant")
    .insert({
      slug,
      legal_name: input.legalName.trim(),
      trade_name: input.tradeName?.trim() || null,
      sector: input.sector?.trim() || null,
      cnpj,
      email: input.email?.trim().toLowerCase() || null,
      phone: input.phone?.replace(/\D/g, "") || null,
    })
    .select()
    .single();
  if (tenantError) throw tenantError;

  let authUserId: string | null = null;

  try {
    await seedTenantRoles(tenant.id);

    await admin.from("branch").insert({
      tenant_id: tenant.id,
      name: "Sede",
    });

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: masterEmail,
      password: input.masterPassword,
      email_confirm: true,
      user_metadata: { full_name: input.masterName.trim() },
    });
    if (authError) throw authError;
    authUserId = authData.user.id;

    const { data: appUser, error: appUserError } = await admin
      .from("app_user")
      .insert({
        tenant_id: tenant.id,
        auth_user_id: authUserId,
        full_name: input.masterName.trim(),
        email: masterEmail,
      })
      .select()
      .single();
    if (appUserError) throw appUserError;

    const { data: adminRole, error: roleError } = await admin
      .from("role")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("name", "admin")
      .single();
    if (roleError || !adminRole) throw roleError ?? new Error("role admin não encontrada");

    const { error: urError } = await admin.from("user_role").insert({
      tenant_id: tenant.id,
      app_user_id: appUser.id,
      role_id: adminRole.id,
      scope: "tenant",
    });
    if (urError) throw urError;

    await admin.from("outbox_event").insert({
      tenant_id: tenant.id,
      aggregate_type: "tenant",
      aggregate_id: tenant.id,
      event_type: "tenant.provisioned",
      payload: {
        master_email: masterEmail,
        master_name: input.masterName,
        app_user_id: appUser.id,
        by_platform_admin: input.invitedByPlatformAdminId,
        mode: "password",
      },
    });

    return { tenant, masterEmail, appUserId: appUser.id };
  } catch (err) {
    if (authUserId) {
      await admin.auth.admin.deleteUser(authUserId).catch(() => undefined);
    }
    await admin.from("user_role").delete().eq("tenant_id", tenant.id);
    await admin.from("app_user").delete().eq("tenant_id", tenant.id);
    await admin.from("role_permission").delete().eq("tenant_id", tenant.id);
    await admin.from("role").delete().eq("tenant_id", tenant.id);
    await admin.from("branch").delete().eq("tenant_id", tenant.id);
    await admin.from("outbox_event").delete().eq("tenant_id", tenant.id);
    await admin.from("tenant").delete().eq("id", tenant.id);
    throw err;
  }
}
