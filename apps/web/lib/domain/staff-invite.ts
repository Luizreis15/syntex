import { createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { RoleName } from "@syntex/permissions";
import type { Scope } from "@syntex/types";

type Client = SupabaseClient<Database>;

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function mintInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashInviteToken(token) };
}

export async function createDepartment(
  supabase: Client,
  input: { tenantId: string; name: string; branchId?: string | null },
) {
  const { data, error } = await supabase
    .from("department")
    .insert({
      tenant_id: input.tenantId,
      name: input.name,
      branch_id: input.branchId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createStaffInvite(
  supabase: Client,
  input: {
    tenantId: string;
    email: string;
    roleName: RoleName;
    scope: Scope;
    branchId?: string | null;
    departmentId?: string | null;
    companyId?: string | null;
    officeId?: string | null;
    personId?: string | null;
    invitedBy?: string | null;
    expiresInHours?: number;
  },
) {
  if (input.scope === "branch" && !input.branchId) {
    throw new Error("branchId obrigatório para escopo branch");
  }
  if (input.scope === "department" && !input.departmentId) {
    throw new Error("departmentId obrigatório para escopo department");
  }
  if (input.scope === "company" && !input.companyId) {
    throw new Error("companyId obrigatório para escopo company");
  }
  if (input.scope === "office" && !input.officeId) {
    throw new Error("officeId obrigatório para escopo office");
  }
  if (input.roleName === "associate" && !input.personId) {
    throw new Error("personId obrigatório para convite de associado");
  }

  const { token, tokenHash } = mintInviteToken();
  const hours = input.expiresInHours ?? 72;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("staff_invite")
    .insert({
      tenant_id: input.tenantId,
      email: input.email.trim().toLowerCase(),
      role_name: input.roleName,
      scope: input.scope,
      branch_id: input.branchId ?? null,
      department_id: input.departmentId ?? null,
      company_id: input.companyId ?? null,
      office_id: input.officeId ?? null,
      person_id: input.personId ?? null,
      invited_by: input.invitedBy ?? null,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select()
    .single();
  if (error) throw error;

  return { invite: data, token };
}

/**
 * Aceita convite: cria/liga app_user + user_role. Token em claro só nesta chamada.
 */
export async function acceptStaffInvite(
  supabase: Client,
  input: {
    token: string;
    authUserId: string;
    fullName: string;
  },
) {
  const tokenHash = hashInviteToken(input.token);
  const { data: invite, error } = await supabase
    .from("staff_invite")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!invite) throw new Error("convite inválido ou já usado");
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    throw new Error("convite expirado");
  }

  const { data: existing } = await supabase
    .from("app_user")
    .select("id")
    .eq("tenant_id", invite.tenant_id)
    .eq("auth_user_id", input.authUserId)
    .maybeSingle();

  let appUserId = existing?.id;
  if (!appUserId) {
    const { data: created, error: createError } = await supabase
      .from("app_user")
      .insert({
        tenant_id: invite.tenant_id,
        auth_user_id: input.authUserId,
        full_name: input.fullName,
        email: invite.email,
      })
      .select()
      .single();
    if (createError) throw createError;
    appUserId = created.id;
  }

  const { data: role, error: roleError } = await supabase
    .from("role")
    .upsert(
      { tenant_id: invite.tenant_id, name: invite.role_name },
      { onConflict: "tenant_id,name" },
    )
    .select()
    .single();
  if (roleError) throw roleError;

  const { error: urError } = await supabase.from("user_role").insert({
    tenant_id: invite.tenant_id,
    app_user_id: appUserId,
    role_id: role.id,
    scope: invite.scope,
    branch_id: invite.branch_id,
    department_id: invite.department_id,
    company_id: invite.company_id,
    office_id: invite.office_id,
  });
  if (urError) throw urError;

  if (invite.person_id) {
    const { error: linkError } = await supabase
      .from("person")
      .update({ app_user_id: appUserId })
      .eq("tenant_id", invite.tenant_id)
      .eq("id", invite.person_id)
      .is("app_user_id", null);
    if (linkError) throw linkError;
  }

  if (invite.office_id && invite.scope === "office") {
    const { materializeOfficeDelegationsForMember } = await import("@/lib/domain/office");
    await materializeOfficeDelegationsForMember(supabase, {
      tenantId: invite.tenant_id,
      officeId: invite.office_id,
      appUserId,
      grantedBy: invite.invited_by,
    });
  }

  const { data: accepted, error: acceptError } = await supabase
    .from("staff_invite")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id)
    .eq("tenant_id", invite.tenant_id)
    .select()
    .single();
  if (acceptError) throw acceptError;

  return { invite: accepted, appUserId };
}
