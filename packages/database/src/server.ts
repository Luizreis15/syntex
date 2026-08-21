import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { Database } from "./types";

function requirePublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes no runtime. Confira Environment Variables no projeto Vercel do domínio.",
    );
  }
  return { url, anon };
}

/**
 * Cliente Supabase para uso em Server Components / Route Handlers.
 * Sempre chave anon + JWT do usuário (cookie de sessão) — nunca service_role.
 * O adapter de cookies é injetado para não acoplar este pacote ao Next.js.
 */
export function createSupabaseServerClient(cookies: CookieMethodsServer) {
  const { url, anon } = requirePublicSupabaseEnv();
  return createServerClient<Database>(url, anon, { cookies });
}

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;
