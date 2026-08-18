import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@syntex/database";

export function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createSupabaseServerClient({
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch {
        // chamado de um Server Component sem permissão de escrita em cookie;
        // a sessão é refrescada pelo middleware na próxima navegação.
      }
    },
  });
}
