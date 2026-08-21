import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com service_role — ignora RLS.
 *
 * USO PROIBIDO em rota da aplicação web ou em qualquer código que atenda
 * requisição de usuário (CLAUDE.md #2), exceto control plane /webhooks que
 * já operam cross-tenant por desenho. Nunca no client bundle.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ausente no runtime Vercel (necessária para /platform).",
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
