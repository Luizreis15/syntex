"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GatewayChargeActions({
  chargeId,
  hasIntent,
  status,
}: {
  chargeId: string;
  hasIntent: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const busy = pending != null;
  const canIntent = status === "pendente" || status === "vencido";

  async function createIntent(billingType: "pix" | "boleto") {
    setPending(billingType);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/charges/${chargeId}/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billingType }),
    });
    const json = await res.json();
    setPending(null);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao gerar intent.");
      return;
    }
    setMessage(`Intent ${billingType} criado (${json.data.intent.provider}).`);
    router.refresh();
  }

  async function sync(forcePaid = false) {
    setPending(forcePaid ? "sync-paid" : "sync");
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/charges/${chargeId}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forcePaid ? { forceStatus: "paid" } : {}),
    });
    const json = await res.json();
    setPending(null);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao sincronizar.");
      return;
    }
    setMessage(`Status gateway: ${json.data.gatewayStatus}`);
    router.refresh();
  }

  if (!canIntent && status === "pago") return null;

  return (
    <div className="space-y-2 rounded-sm border border-border bg-surface-2 p-4">
      <h3 className="text-component font-semibold text-ink">Gateway de pagamento</h3>
      <p className="text-label text-ink-3">
        Usa `tenant.default_charge_provider` (stub ou asaas). Itaú no Lote 6.
      </p>
      <div className="flex flex-wrap gap-2">
        {!hasIntent && canIntent && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => createIntent("pix")}
              className="h-input rounded-sm border border-border-strong px-3 text-body disabled:opacity-50"
            >
              {pending === "pix" ? "Gerando…" : "Gerar PIX"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => createIntent("boleto")}
              className="h-input rounded-sm border border-border-strong px-3 text-body disabled:opacity-50"
            >
              {pending === "boleto" ? "Gerando…" : "Gerar boleto"}
            </button>
          </>
        )}
        {hasIntent && canIntent && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => sync(false)}
              className="h-input rounded-sm border border-border-strong px-3 text-body disabled:opacity-50"
            >
              {pending === "sync" ? "Sincronizando…" : "Sincronizar status"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => sync(true)}
              className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
            >
              {pending === "sync-paid" ? "Liquidando…" : "Forçar pago (DEV)"}
            </button>
          </>
        )}
      </div>
      {error && <p className="text-body text-danger">{error}</p>}
      {message && <p className="text-body text-ink-2">{message}</p>}
    </div>
  );
}
