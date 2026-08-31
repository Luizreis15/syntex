import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { fetchRevenuePlanViews, type RevenuePlanView } from "@/lib/domain/revenue-plan";

type Client = SupabaseClient<Database>;

export type RevenuePlanListItem = RevenuePlanView;

export async function fetchRevenuePlans(supabase: Client, tenantId: string): Promise<RevenuePlanListItem[]> {
  return fetchRevenuePlanViews(supabase, tenantId);
}

export async function fetchRevenuePlanOptions(supabase: Client, tenantId: string, competence?: string) {
  return fetchRevenuePlanViews(supabase, tenantId, { activeOnly: true, competence });
}
