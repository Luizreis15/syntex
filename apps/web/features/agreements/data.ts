import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";

type Client = SupabaseClient<Database>;

export interface AgreementListRow {
  id: string;
  kind: "cct" | "act";
  mediador_number: string | null;
  valid_from: string;
  valid_until: string;
  base_date: string;
  economic_name: string | null;
  professional_name: string | null;
  territory_count: number;
}

export async function fetchAgreementsPage(
  supabase: Client,
  tenantId: string,
  opts: { date?: string } = {},
): Promise<AgreementListRow[]> {
  let query = supabase
    .from("collective_agreement")
    .select(
      `
      id,
      kind,
      mediador_number,
      valid_from,
      valid_until,
      base_date,
      economic_category:economic_category_id(name),
      professional_category:professional_category_id(name),
      collective_agreement_territory(count)
    `,
    )
    .eq("tenant_id", tenantId)
    .order("valid_from", { ascending: false });

  if (opts.date) {
    query = query.lte("valid_from", opts.date).gte("valid_until", opts.date);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const economic = row.economic_category as unknown as { name: string } | null;
    const professional = row.professional_category as unknown as { name: string } | null;
    const territory = row.collective_agreement_territory as unknown as { count: number }[] | null;
    return {
      id: row.id,
      kind: row.kind as "cct" | "act",
      mediador_number: row.mediador_number,
      valid_from: row.valid_from,
      valid_until: row.valid_until,
      base_date: row.base_date,
      economic_name: economic?.name ?? null,
      professional_name: professional?.name ?? null,
      territory_count: territory?.[0]?.count ?? 0,
    };
  });
}

export async function fetchAgreementDetail(supabase: Client, tenantId: string, id: string, referenceDate: string) {
  const { data: agreement, error } = await supabase
    .from("collective_agreement")
    .select(
      `
      *,
      economic_category:economic_category_id(name),
      professional_category:professional_category_id(name)
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();
  if (error) throw error;

  const { data: territories, error: terrError } = await supabase
    .from("collective_agreement_territory")
    .select("municipality_id, municipality:municipality_id(name, state_code)")
    .eq("tenant_id", tenantId)
    .eq("collective_agreement_id", id);
  if (terrError) throw terrError;

  const { data: rules, error: rulesError } = await supabase
    .from("contribution_rule")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("collective_agreement_id", id)
    .lte("valid_from", referenceDate)
    .or(`valid_until.is.null,valid_until.gte.${referenceDate}`)
    .order("type");
  if (rulesError) throw rulesError;

  return { agreement, territories: territories ?? [], rules: rules ?? [] };
}
