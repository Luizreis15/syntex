import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getSupabasePublicConfig } from "./server";

/**
 * Cliente com service_role — ignora RLS.
 * Cross-tenant (control plane / webhooks). Nunca no client bundle.
 */
export function createSupabaseAdminClient() {
  const { url } = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_URL ausente no runtime Vercel (necessária para /platform).",
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
