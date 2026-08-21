"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateOfficeForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenOnce, setTokenOnce] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setTokenOnce(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/offices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        document: fd.get("document") || undefined,
        masterEmail: fd.get("masterEmail"),
        masterFullName: fd.get("masterFullName"),
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao criar.");
      return;
    }
    setTokenOnce(json.data.inviteToken as string);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border-b border-border pb-6">
      <h2 className="text-component font-semibold text-ink">Novo escritório</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-body">
          <span className="text-label text-ink-3">Nome</span>
          <input name="name" required className="mt-1 h-input w-full rounded-sm border border-border px-3" />
        </label>
        <label className="block text-body">
          <span className="text-label text-ink-3">Documento (opcional)</span>
          <input name="document" className="mt-1 h-input w-full rounded-sm border border-border px-3 font-mono" />
        </label>
        <label className="block text-body">
          <span className="text-label text-ink-3">E-mail do master</span>
          <input
            name="masterEmail"
            type="email"
            required
            className="mt-1 h-input w-full rounded-sm border border-border px-3"
          />
        </label>
        <label className="block text-body">
          <span className="text-label text-ink-3">Nome do master</span>
          <input
            name="masterFullName"
            required
            className="mt-1 h-input w-full rounded-sm border border-border px-3"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Criando…" : "Criar e emitir convite"}
      </button>
      {error && <p className="text-body text-danger">{error}</p>}
      {tokenOnce && (
        <p className="break-all rounded-sm border border-border bg-surface-2 p-3 font-mono text-label">
          Token do office_master (copie agora): {tokenOnce}
        </p>
      )}
    </form>
  );
}
