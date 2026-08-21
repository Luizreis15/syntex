import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * URL/anon no servidor: preferir nomes SEM NEXT_PUBLIC_ (lidos no runtime).
 * NEXT_PUBLIC_* é inlined no `next build` — se o Build viu vazio, Server Action
 * fica com "" para sempre até rebuild com as vars presentes.
 */
export function getSupabasePublicConfig() {
  const url = (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ""
  );
  const anon = (
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
  return { url, anon };
}

export function createSupabaseServerClient(cookies: CookieMethodsServer) {
  const { url, anon } = getSupabasePublicConfig();
  if (!url || !anon) {
    throw new Error(
      "SUPABASE_URL/ANON_KEY (ou NEXT_PUBLIC_*) ausentes no runtime. Na Vercel do projeto syntex-web, defina SUPABASE_URL e SUPABASE_ANON_KEY.",
    );
  }
  return createServerClient<Database>(url, anon, { cookies });
}

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;
