"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OfficeActions({
  officeId,
  companies,
}: {
  officeId: string;
  companies: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [tokenOnce, setTokenOnce] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function link(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/offices/${officeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "link",
        companyId: fd.get("companyId"),
        reason: fd.get("reason"),
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao vincular.");
      return;
    }
    router.refresh();
  }

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setTokenOnce(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/offices/${officeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invite",
        email: fd.get("email"),
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao convidar.");
      return;
    }
    setTokenOnce(json.data.inviteToken as string);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={link} className="space-y-3 border-b border-border pb-4">
        <h3 className="text-component font-semibold text-ink">Vincular empresa</h3>
        <label className="block text-body">
          <span className="text-label text-ink-3">Empresa</span>
          <select
            name="companyId"
            required
            className="mt-1 h-input w-full rounded-sm border border-border px-3"
          >
            <option value="">Selecione…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-body">
          <span className="text-label text-ink-3">Motivo (obrigatório)</span>
          <input
            name="reason"
            required
            minLength={3}
            placeholder="Procuração / contrato de serviços contábeis"
            className="mt-1 h-input w-full rounded-sm border border-border px-3"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
        >
          Vincular
        </button>
      </form>

      <form onSubmit={invite} className="space-y-3">
        <h3 className="text-component font-semibold text-ink">Convidar operador</h3>
        <label className="block text-body">
          <span className="text-label text-ink-3">E-mail</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 h-input w-full rounded-sm border border-border px-3"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-input rounded-sm border border-border px-3 text-body disabled:opacity-50"
        >
          Convidar office_user
        </button>
      </form>

      {error && <p className="text-body text-danger">{error}</p>}
      {tokenOnce && (
        <p className="break-all rounded-sm border border-border bg-surface-2 p-3 font-mono text-label">
          Token (copie agora): {tokenOnce}
        </p>
      )}
    </div>
  );
}
