"use client";

import { useState } from "react";

export function IssueAssociateAccessButton({
  personId,
  hasAccess,
  hasEmail,
}: {
  personId: string;
  hasAccess: boolean;
  hasEmail: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenOnce, setTokenOnce] = useState<string | null>(null);

  if (hasAccess) {
    return <p className="text-body text-ink-2">Acesso ao portal já emitido.</p>;
  }

  async function issue() {
    setPending(true);
    setError(null);
    setTokenOnce(null);
    const res = await fetch("/api/associates/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao emitir.");
      return;
    }
    setTokenOnce(json.data.inviteToken as string);
  }

  return (
    <div className="space-y-2">
      {!hasEmail && (
        <p className="text-body text-ink-2">Cadastre um e-mail na pessoa para emitir o acesso.</p>
      )}
      <button
        type="button"
        disabled={pending || !hasEmail}
        onClick={issue}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Emitindo…" : "Emitir acesso ao portal"}
      </button>
      {error && <p className="text-body text-danger">{error}</p>}
      {tokenOnce && (
        <p className="break-all rounded-sm border border-border bg-surface-2 p-3 font-mono text-label">
          Token do associado (copie agora): {tokenOnce}
        </p>
      )}
    </div>
  );
}
