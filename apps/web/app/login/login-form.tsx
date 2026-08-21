"use client";

import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { signInWithPassword } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-input w-full rounded-sm bg-petrol-800 text-body font-semibold text-shell-ink transition-colors hover:bg-petrol-700 disabled:opacity-50"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "credentials") return "E-mail ou senha inválidos.";
  if (code === "missing") return "Informe e-mail e senha.";
  if (code === "config") {
    return "Falha de configuração no servidor (Supabase URL/KEY). Confira as variáveis na Vercel.";
  }
  return "Não foi possível entrar. Tente de novo.";
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const error = errorMessage(searchParams.get("error"));

  return (
    <form action={signInWithPassword} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-label uppercase text-ink-3">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
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
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-input w-full rounded-sm border border-border bg-surface px-3 text-body text-ink outline-none focus-visible:border-petrol-600"
        />
      </div>
      {error && <p className="text-body text-danger">{error}</p>}
      <SubmitButton />
    </form>
  );
}
