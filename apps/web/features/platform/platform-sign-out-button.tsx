"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PlatformSignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex h-input items-center rounded-sm border border-border px-3 text-body text-ink-2 hover:bg-surface-2"
    >
      Sair
    </button>
  );
}
