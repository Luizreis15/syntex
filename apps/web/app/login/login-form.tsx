"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.push("/empresas");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-label uppercase text-ink-3">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="h-input w-full rounded-sm border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-petrol-600"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-label uppercase text-ink-3">
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="h-input w-full rounded-sm border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-petrol-600"
        />
      </div>
      {error && <p className="text-body text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="h-input w-full rounded-sm bg-petrol-800 text-body font-semibold text-shell-ink transition-colors hover:bg-petrol-700 disabled:opacity-50"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
