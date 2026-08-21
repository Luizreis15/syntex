"use client";

import { useState } from "react";

export function InviteCompanyUserForm({ companyId }: { companyId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [tokenOnce, setTokenOnce] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setTokenOnce(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/company-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), companyId }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao convidar.");
      return;
    }
    setTokenOnce(json.data.token as string);
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      {error && <p className="text-body text-danger">{error}</p>}
      {tokenOnce && (
        <p className="break-all rounded-sm border border-border bg-surface-2 p-3 font-mono text-label">
          Token do operador (copie agora): {tokenOnce}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="email" className="text-label text-ink-3">
          E-mail do company_user
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm border border-border-strong px-3 text-body disabled:opacity-50"
      >
        Convidar operador
      </button>
    </form>
  );
}
