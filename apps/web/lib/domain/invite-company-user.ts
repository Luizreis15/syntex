import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { createStaffInvite } from "@/lib/domain/staff-invite";

type Client = SupabaseClient<Database>;

export async function inviteCompanyUser(
  supabase: Client,
  input: {
    tenantId: string;
    companyId: string;
    email: string;
    invitedBy: string;
  },
) {
  await supabase
    .from("role")
    .upsert({ tenant_id: input.tenantId, name: "company_user" }, { onConflict: "tenant_id,name" });

  return createStaffInvite(supabase, {
    tenantId: input.tenantId,
    email: input.email,
    roleName: "company_user",
    scope: "company",
    companyId: input.companyId,
    invitedBy: input.invitedBy,
  });
}
