import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";

type Client = SupabaseClient<Database>;

export async function fetchChargesPage(
  supabase: Client,
  tenantId: string,
  status?: string,
  companyId?: string | null,
) {
  let query = supabase
    .from("charge")
    .select(
      `
      id, amount, due_date, status, paid_at, payment_method, created_at, obligation_id,
      obligation:obligation_id(
        id, competence, status, company_id,
        company:company_id(id, legal_name, trade_name, cnpj)
      )
    `,
    )
    .eq("tenant_id", tenantId)
    .order("due_date", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  if (!companyId) return rows;
  return rows.filter((row) => {
    const obligation = row.obligation as unknown as { company_id: string } | null;
    return obligation?.company_id === companyId;
  });
}

export async function fetchChargeDetail(supabase: Client, tenantId: string, id: string) {
  const { data: charge, error } = await supabase
    .from("charge")
    .select(
      `
      *,
      obligation:obligation_id(
        *,
        company:company_id(id, legal_name, trade_name, cnpj),
        contribution_rule:contribution_rule_id(type, value_type, value, calculation_base)
      )
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();
  if (error) throw error;

  const { data: journal } = await supabase
    .from("journal_entry")
    .select("*, journal_line(*)")
    .eq("tenant_id", tenantId)
    .eq("charge_id", id)
    .maybeSingle();

  return { charge, journal };
}
