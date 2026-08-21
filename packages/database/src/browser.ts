import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY ausentes no bundle. Na Vercel: salve as envs e Redeploy sem Build Cache.",
    );
  }
  return createBrowserClient<Database>(url, anon);
}
