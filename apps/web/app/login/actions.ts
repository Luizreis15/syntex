"use server";

import { redirect } from "next/navigation";
import { getSupabasePublicConfig } from "@syntex/database";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Login no servidor (cookies + env de runtime).
 * Sem useFormState: redirect() + useFormState vira "Application error" no Next 14.
 */
export async function signInWithPassword(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const { url, anon } = getSupabasePublicConfig();
  if (!url) {
    redirect("/login?error=config_url");
  }
  if (!anon) {
    redirect("/login?error=config_anon");
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/login?error=credentials");
  }

  redirect("/inicio");
}
