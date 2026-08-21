"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelChargeButton({
  tenantId,
  chargeId,
  status,
}: {
  tenantId: string;
  chargeId: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "pendente" && status !== "vencido") return null;

  async function confirm() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/platform/charges/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, chargeId, reason }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao cancelar.");
      return;
    }
    setOpen(false);
    setReason("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-label text-danger hover:underline"
      >
        Cancelar
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-sm border border-border bg-surface-2 p-2">
      <label className="block text-label text-ink-3">
        Motivo
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minLength={3}
          className="mt-1 h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
          placeholder="Ex.: emitida em duplicidade"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || reason.trim().length < 3}
          onClick={confirm}
          className="h-input rounded-sm bg-petrol-800 px-2 text-label text-shell-ink disabled:opacity-50"
        >
          {pending ? "…" : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-input rounded-sm border border-border px-2 text-label"
        >
          Voltar
        </button>
      </div>
      {error && <p className="text-label text-danger">{error}</p>}
    </div>
  );
}
