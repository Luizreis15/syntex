"use client";

import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { signInWithPassword } from "./actions";

const isDev = process.env.NODE_ENV === "development";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-petrol-800 text-dense font-semibold text-shell-ink transition-colors hover:bg-petrol-700 disabled:opacity-50"
    >
      {pending ? "Entrando…" : "Entrar no Syntex"}
      {!pending ? <ArrowRight className="size-4" aria-hidden /> : null}
    </button>
  );
}

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "credentials") return "E-mail ou senha inválidos.";
  if (code === "missing") return "Informe e-mail e senha.";
  if (code === "config" || code === "config_url") {
    return "Falta SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) no runtime da Vercel. Recrie no projeto syntex-web e Redeploy.";
  }
  if (code === "config_anon") {
    return "Falta SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) no runtime. Recrie no projeto syntex-web e Redeploy.";
  }
  return "Não foi possível entrar. Tente de novo.";
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const error = errorMessage(searchParams.get("error"));

  return (
    <form action={signInWithPassword} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-label font-semibold uppercase tracking-[0.08em] text-ink-3">
          E-mail
        </label>
        <div className="flex h-11 items-center gap-2.5 rounded-control border border-border bg-surface px-3 shadow-surface transition-colors focus-within:border-petrol-600">
          <Mail className="size-4 shrink-0 text-ink-3" aria-hidden />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nome@sindicato.org.br"
            className="h-full w-full bg-transparent text-dense font-medium text-ink outline-none placeholder:text-ink-3"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-label font-semibold uppercase tracking-[0.08em] text-ink-3"
        >
          Senha
        </label>
        <div className="flex h-11 items-center gap-2.5 rounded-control border border-border bg-surface px-3 shadow-surface transition-colors focus-within:border-petrol-600">
          <Lock className="size-4 shrink-0 text-ink-3" aria-hidden />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-full w-full bg-transparent text-dense font-medium text-ink outline-none placeholder:text-ink-3"
          />
        </div>
      </div>

      {error ? <p className="text-dense font-medium text-danger">{error}</p> : null}

      <SubmitButton />

      {isDev ? (
        <div
          className="flex items-center gap-3 rounded-control border border-dashed border-border/70 bg-surface-2/40 px-3 py-2.5 opacity-70"
          aria-disabled="true"
        >
          <span className="inline-flex h-7 items-center rounded-xs bg-ink/80 px-2 font-mono text-label font-bold tracking-wide text-shell-ink">
            SSO
          </span>
          <p className="text-label font-medium leading-snug text-ink-3">
            Federado · placeholder DEV — sem implementação
          </p>
        </div>
      ) : null}
    </form>
  );
}
