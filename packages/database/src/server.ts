import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Cliente Supabase para uso em Server Components / Route Handlers.
 * Sempre chave anon + JWT do usuário (cookie de sessão) — nunca service_role.
 * O adapter de cookies é injetado para não acoplar este pacote ao Next.js.
 */
export function createSupabaseServerClient(cookies: CookieMethodsServer) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies },
  );
}

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;
