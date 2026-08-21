import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { UserGrant } from "@syntex/permissions";
import { can, primaryCompanyId } from "@syntex/permissions";

type Client = SupabaseClient<Database>;

export async function resolveChargeCompanyId(
  supabase: Client,
  tenantId: string,
  chargeId: string,
): Promise<string | null> {
  const { data: charge, error } = await supabase
    .from("charge")
    .select("obligation_id")
    .eq("tenant_id", tenantId)
    .eq("id", chargeId)
    .maybeSingle();
  if (error) throw error;
  if (!charge?.obligation_id) return null;

  const { data: obligation, error: obError } = await supabase
    .from("obligation")
    .select("company_id")
    .eq("tenant_id", tenantId)
    .eq("id", charge.obligation_id)
    .maybeSingle();
  if (obError) throw obError;
  return obligation?.company_id ?? null;
}

/** Autoriza finance.pay ou finance.write na cobrança (com companyId quando portal). */
export function canPayOrWriteCharge(
  grants: UserGrant[],
  tenantId: string,
  companyId: string | null,
  appUserId?: string,
): boolean {
  const resource = { tenantId, companyId: companyId ?? undefined };
  return (
    can(grants, "finance.write", tenantId, resource, appUserId) ||
    can(grants, "finance.pay", tenantId, resource, appUserId)
  );
}

export function requirePortalCompanyId(grants: UserGrant[]): string {
  const id = primaryCompanyId(grants);
  if (!id) throw new Error("ator sem empresa vinculada");
  return id;
}
