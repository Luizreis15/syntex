import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com service_role — ignora RLS.
 *
 * USO PROIBIDO em rota da aplicação web ou em qualquer código que atenda
 * requisição de usuário (CLAUDE.md #2: "a aplicação web usa a chave anon +
 * JWT do usuário. Nunca service_role."). Reservado a scripts server-only:
 * seed, migrations auxiliares e fixtures de teste que precisam popular mais
 * de um tenant. Nunca importe isto de dentro de apps/web/app/**.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada — só deve existir em .env.local, nunca em commit.");
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
