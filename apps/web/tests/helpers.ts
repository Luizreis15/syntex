import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient, type Database } from "@syntex/database";
import type { RoleName } from "@syntex/permissions";

export const admin = createSupabaseAdminClient();

let counter = 0;
export function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function createTestTenant(slugPrefix: string) {
  const slug = unique(slugPrefix);
  const { data, error } = await admin
    .from("tenant")
    .insert({ slug, legal_name: `Tenant de teste ${slug}`, cnpj: unique("00000000") })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTestTenant(tenantId: string) {
  // Ordem inversa das FKs — tabelas de tenant primeiro, tenant por último.
  const tables = [
    "audit_log",
    "outbox_event",
    "contribution_rule",
    "collective_agreement_territory",
    "collective_agreement",
    "union_representation",
    "union_territory",
    "union_registration",
    "professional_category",
    "economic_category",
    "establishment",
    "company",
    "user_role",
    "role_permission",
    "role",
    "app_user",
    "branch",
  ] as const;
  for (const table of tables) {
    await admin.from(table).delete().eq("tenant_id", tenantId);
  }
  await admin.from("tenant").delete().eq("id", tenantId);
}

export async function createTestUser(tenantId: string, roleName: RoleName, scope: string, branchId?: string) {
  const email = `${unique("test")}@example.com`;
  const password = "test-password-123!";

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw createError;

  const { data: appUser, error: appUserError } = await admin
    .from("app_user")
    .insert({ tenant_id: tenantId, auth_user_id: created.user.id, full_name: email, email })
    .select()
    .single();
  if (appUserError) throw appUserError;

  const { data: role, error: roleError } = await admin
    .from("role")
    .upsert({ tenant_id: tenantId, name: roleName }, { onConflict: "tenant_id,name" })
    .select()
    .single();
  if (roleError) throw roleError;

  const { error: userRoleError } = await admin.from("user_role").insert({
    tenant_id: tenantId,
    app_user_id: appUser.id,
    role_id: role.id,
    scope,
    branch_id: branchId ?? null,
  });
  if (userRoleError) throw userRoleError;

  const anon = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error: signInError } = await anon.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return { client: anon, appUserId: appUser.id, authUserId: created.user.id, email };
}
