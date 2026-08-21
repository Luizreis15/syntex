"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateNotificationForm({
  tenants,
}: {
  tenants: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setError(null);
    const fd = new FormData(form);
    const tenantId = (fd.get("tenantId") as string) || null;
    const res = await fetch("/api/platform/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        body: fd.get("body"),
        severity: fd.get("severity"),
        tenantId,
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3 border-b border-border pb-6">
      <h2 className="text-component font-semibold text-ink">Nova notificação</h2>
      <Field label="Título" name="title" required />
      <div className="space-y-1">
        <label htmlFor="body" className="text-label text-ink-3">
          Mensagem
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={3}
          className="w-full rounded-sm border border-border bg-surface px-2 py-2 text-body"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="severity" className="text-label text-ink-3">
            Severidade
          </label>
          <select
            id="severity"
            name="severity"
            defaultValue="info"
            className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
          >
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="critical">critical</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="tenantId" className="text-label text-ink-3">
            Sindicato (opcional)
          </label>
          <select
            id="tenantId"
            name="tenantId"
            className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
          >
            <option value="">Todos / nenhum</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Publicando…" : "Publicar"}
      </button>
      {error && <p className="text-body text-danger">{error}</p>}
    </form>
  );
}

function Field({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-label text-ink-3">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
      />
    </div>
  );
}

export function MarkNotificationsReadButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function markAll() {
    setPending(true);
    await fetch("/api/platform/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={markAll}
      className="h-input rounded-sm border border-border px-3 text-body disabled:opacity-50"
    >
      {pending ? "…" : "Marcar todas como lidas"}
    </button>
  );
}
