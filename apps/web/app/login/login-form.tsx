"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInWithPassword, type SignInState } from "./actions";

const initial: SignInState = { error: null };

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

export function LoginForm() {
  const [state, action] = useFormState(signInWithPassword, initial);

  return (
    <form action={action} className="space-y-4">
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
      {state.error && <p className="text-body text-danger">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
