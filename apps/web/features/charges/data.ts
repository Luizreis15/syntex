import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";

type Client = SupabaseClient<Database>;

/** FK composta de contexto (não confundir com debtor/remitting após ADR-023). */
const OBLIGATION_COMPANY_EMBED =
  "company!obligation_company_id_tenant_id_fkey(id, legal_name, trade_name, cnpj)";

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
      obligation(
        id, competence, status, company_id,
        ${OBLIGATION_COMPANY_EMBED}
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
      obligation(
        *,
        ${OBLIGATION_COMPANY_EMBED},
        contribution_rule(type, value_type, value, calculation_base)
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
