"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettleChargeButton({ chargeId, disabled }: { chargeId: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function settle() {
    if (!confirm("Confirmar baixa manual desta cobrança?")) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/charges/${chargeId}/settle`, { method: "POST" });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha na baixa.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={settle}
        disabled={disabled || pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Baixando…" : "Baixa manual"}
      </button>
      {error && <p className="text-body text-danger">{error}</p>}
    </div>
  );
}
