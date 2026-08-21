import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { createStaffInvite, acceptStaffInvite } from "@/lib/domain/staff-invite";

type Client = SupabaseClient<Database>;

async function listOfficeMemberIds(
  supabase: Client,
  tenantId: string,
  officeId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_role")
    .select("app_user_id")
    .eq("tenant_id", tenantId)
    .eq("office_id", officeId)
    .eq("scope", "office");
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.app_user_id))];
}

async function listLinkedCompanyIds(
  supabase: Client,
  tenantId: string,
  officeId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("office_company_link")
    .select("company_id")
    .eq("tenant_id", tenantId)
    .eq("office_id", officeId)
    .is("valid_until", null);
  if (error) throw error;
  return (data ?? []).map((r) => r.company_id);
}

/** Emite delegação A→empresa se ainda não houver ativa. */
export async function ensureCompanyDelegation(
  supabase: Client,
  input: {
    tenantId: string;
    principalAppUserId: string;
    companyId: string;
    officeId: string;
    reason: string;
    grantedBy?: string | null;
  },
) {
  const { data: existing } = await supabase
    .from("delegation")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .eq("principal_app_user_id", input.principalAppUserId)
    .eq("subject_kind", "company")
    .eq("subject_id", input.companyId)
    .is("revoked_at", null)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("delegation")
    .insert({
      tenant_id: input.tenantId,
      principal_app_user_id: input.principalAppUserId,
      subject_kind: "company",
      subject_id: input.companyId,
      office_id: input.officeId,
      reason: input.reason,
      granted_by: input.grantedBy ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createOfficeWithMaster(
  supabase: Client,
  input: {
    tenantId: string;
    name: string;
    document?: string | null;
    masterEmail: string;
    masterFullName: string;
    createdBy?: string | null;
  },
): Promise<{ office: Database["public"]["Tables"]["office"]["Row"]; inviteToken: string }> {
  const { data: office, error } = await supabase
    .from("office")
    .insert({
      tenant_id: input.tenantId,
      name: input.name.trim(),
      document: input.document?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from("role")
    .upsert({ tenant_id: input.tenantId, name: "office_master" }, { onConflict: "tenant_id,name" });

  const { invite, token } = await createStaffInvite(supabase, {
    tenantId: input.tenantId,
    email: input.masterEmail,
    roleName: "office_master",
    scope: "office",
    officeId: office.id,
    invitedBy: input.createdBy ?? null,
  });

  await supabase.from("outbox_event").insert({
    tenant_id: input.tenantId,
    aggregate_type: "office",
    aggregate_id: office.id,
    event_type: "office.provisioned",
    payload: { invite_id: invite.id, master_email: input.masterEmail },
  });

  return { office, inviteToken: token };
}

export async function linkOfficeCompany(
  supabase: Client,
  input: {
    tenantId: string;
    officeId: string;
    companyId: string;
    reason: string;
    linkedBy: string;
  },
) {
  const { data: link, error } = await supabase
    .from("office_company_link")
    .insert({
      tenant_id: input.tenantId,
      office_id: input.officeId,
      company_id: input.companyId,
      reason: input.reason,
      linked_by: input.linkedBy,
    })
    .select()
    .single();
  if (error) throw error;

  const members = await listOfficeMemberIds(supabase, input.tenantId, input.officeId);
  for (const principalId of members) {
    await ensureCompanyDelegation(supabase, {
      tenantId: input.tenantId,
      principalAppUserId: principalId,
      companyId: input.companyId,
      officeId: input.officeId,
      reason: input.reason,
      grantedBy: input.linkedBy,
    });
  }

  await supabase.from("outbox_event").insert({
    tenant_id: input.tenantId,
    aggregate_type: "office",
    aggregate_id: input.officeId,
    event_type: "office.company_linked",
    payload: { company_id: input.companyId, link_id: link.id, members: members.length },
  });

  return link;
}

export async function inviteOfficeUser(
  supabase: Client,
  input: {
    tenantId: string;
    officeId: string;
    email: string;
    invitedBy: string;
    asMaster?: boolean;
  },
) {
  const roleName = input.asMaster ? "office_master" : "office_user";
  await supabase
    .from("role")
    .upsert({ tenant_id: input.tenantId, name: roleName }, { onConflict: "tenant_id,name" });

  return createStaffInvite(supabase, {
    tenantId: input.tenantId,
    email: input.email,
    roleName,
    scope: "office",
    officeId: input.officeId,
    invitedBy: input.invitedBy,
  });
}

/**
 * Após aceitar convite de office_*: materializa delegações para empresas já linkadas.
 */
export async function materializeOfficeDelegationsForMember(
  supabase: Client,
  input: { tenantId: string; officeId: string; appUserId: string; grantedBy?: string | null },
) {
  const companies = await listLinkedCompanyIds(supabase, input.tenantId, input.officeId);
  for (const companyId of companies) {
    await ensureCompanyDelegation(supabase, {
      tenantId: input.tenantId,
      principalAppUserId: input.appUserId,
      companyId,
      officeId: input.officeId,
      reason: "membro do escritório — empresas já vinculadas",
      grantedBy: input.grantedBy ?? null,
    });
  }
  return companies.length;
}

export async function acceptOfficeInviteAndMaterialize(
  supabase: Client,
  input: { token: string; authUserId: string; fullName: string },
) {
  const accepted = await acceptStaffInvite(supabase, input);
  if (accepted.invite.office_id && accepted.invite.scope === "office") {
    await materializeOfficeDelegationsForMember(supabase, {
      tenantId: accepted.invite.tenant_id,
      officeId: accepted.invite.office_id,
      appUserId: accepted.appUserId,
      grantedBy: accepted.invite.invited_by,
    });
  }
  return accepted;
}

export async function listActiveCompanyDelegations(
  supabase: Client,
  tenantId: string,
  principalAppUserId: string,
): Promise<{ companyId: string; officeId: string | null }[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("delegation")
    .select("subject_id, office_id, valid_until")
    .eq("tenant_id", tenantId)
    .eq("principal_app_user_id", principalAppUserId)
    .eq("subject_kind", "company")
    .is("revoked_at", null);
  if (error) throw error;

  return (data ?? [])
    .filter((d) => d.valid_until == null || d.valid_until > now)
    .map((d) => ({ companyId: d.subject_id, officeId: d.office_id }));
}
