import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { CompanyOperationalCreateInput } from "@syntex/validation";
import { createStaffInvite } from "@/lib/domain/staff-invite";

type Client = SupabaseClient<Database>;

/**
 * Cadastro operacional: empresa + matriz + convite do responsável pela conta.
 * Caller: union admin com company.master.provision.
 */
export async function createCompanyWithMaster(
  supabase: Client,
  input: CompanyOperationalCreateInput & {
    tenantId: string;
    invitedBy: string;
  },
): Promise<{
  company: Database["public"]["Tables"]["company"]["Row"];
  establishment: Database["public"]["Tables"]["establishment"]["Row"];
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
      primary_cnae_id: input.primaryCnaeId ?? null,
      municipality_id: input.municipalityId ?? null,
      phone: input.phone?.trim() || null,
      address_street: input.addressStreet?.trim() || null,
      address_neighborhood: input.addressNeighborhood?.trim() || null,
      address_city: input.addressCity?.trim() || null,
      address_state: input.addressState ?? null,
      address_zip: input.addressZip ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  try {
    const { data: establishment, error: estError } = await supabase
      .from("establishment")
      .insert({
        tenant_id: input.tenantId,
        company_id: company.id,
        cnpj,
        kind: "matriz",
        cnae_id: input.primaryCnaeId ?? null,
        municipality_id: input.municipalityId ?? null,
      })
      .select()
      .single();
    if (estError) throw estError;

    await supabase
      .from("role")
      .upsert({ tenant_id: input.tenantId, name: "company_master" }, { onConflict: "tenant_id,name" });

    const { invite, token } = await createStaffInvite(supabase, {
      tenantId: input.tenantId,
      email: input.accountResponsibleEmail,
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
        account_responsible_email: input.accountResponsibleEmail,
        account_responsible_name: input.accountResponsibleName,
      },
    });

    return { company, establishment, inviteToken: token, inviteId: invite.id };
  } catch (err) {
    await supabase.from("establishment").delete().eq("company_id", company.id).eq("tenant_id", input.tenantId);
    await supabase.from("company").delete().eq("id", company.id).eq("tenant_id", input.tenantId);
    throw err;
  }
}
