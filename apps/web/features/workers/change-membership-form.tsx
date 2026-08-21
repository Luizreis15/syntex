"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChangeMembershipForm({ personId }: { personId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/memberships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        status: String(fd.get("status")),
        validFrom: String(fd.get("validFrom")),
        category: String(fd.get("category") || "") || undefined,
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao atualizar filiação.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-sm border border-border bg-surface-2 p-4">
      <h3 className="text-component font-semibold text-ink">Alterar status de filiação</h3>
      <p className="text-label text-ink-3">Dado sensível — auditoria registra classificação `sensivel`.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="status" className="text-label text-ink-3">
            Novo status
          </label>
          <select id="status" name="status" required className={inputClass}>
            <option value="ativo">ativo</option>
            <option value="suspenso">suspenso</option>
            <option value="inadimplente">inadimplente</option>
            <option value="desfiliado">desfiliado</option>
            <option value="cancelado">cancelado</option>
            <option value="falecido">falecido</option>
            <option value="prospect">prospect</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="validFrom" className="text-label text-ink-3">
            A partir de
          </label>
          <input id="validFrom" name="validFrom" type="date" required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="category" className="text-label text-ink-3">
            Categoria (opcional)
          </label>
          <input id="category" name="category" className={inputClass} />
        </div>
      </div>
      {error && <p className="text-body text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Registrar status"}
      </button>
    </form>
  );
}

const inputClass =
  "h-input w-full rounded-sm border border-border bg-surface px-2 text-body text-ink";
