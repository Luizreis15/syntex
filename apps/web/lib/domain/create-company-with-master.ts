import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { createStaffInvite } from "@/lib/domain/staff-invite";

type Client = SupabaseClient<Database>;

/**
 * Cria empresa + convite company_master (escopo company).
 * Caller: union admin com company.master.provision / company.write.
 */
export async function createCompanyWithMaster(
  supabase: Client,
  input: {
    tenantId: string;
    legalName: string;
    cnpj: string;
    tradeName?: string | null;
    branchId?: string | null;
    masterEmail: string;
    invitedBy: string;
  },
): Promise<{
  company: Database["public"]["Tables"]["company"]["Row"];
  inviteToken: string;
  inviteId: string;
}> {
  const cnpj = input.cnpj.replace(/\D/g, "");

  const { data: company, error } = await supabase
    .from("company")
    .insert({
      tenant_id: input.tenantId,
      legal_name: input.legalName.trim(),
      trade_name: input.tradeName?.trim() || null,
      cnpj,
      branch_id: input.branchId ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  try {
    // Garante role company_master no tenant
    await supabase
      .from("role")
      .upsert({ tenant_id: input.tenantId, name: "company_master" }, { onConflict: "tenant_id,name" });

    const { invite, token } = await createStaffInvite(supabase, {
      tenantId: input.tenantId,
      email: input.masterEmail,
      roleName: "company_master",
      scope: "company",
      companyId: company.id,
      invitedBy: input.invitedBy,
    });

    await supabase.from("outbox_event").insert({
      tenant_id: input.tenantId,
      aggregate_type: "company",
      aggregate_id: company.id,
      event_type: "company.master_invited",
      payload: {
        invite_id: invite.id,
        master_email: input.masterEmail,
      },
    });

    return { company, inviteToken: token, inviteId: invite.id };
  } catch (err) {
    await supabase.from("company").delete().eq("id", company.id).eq("tenant_id", input.tenantId);
    throw err;
  }
}
