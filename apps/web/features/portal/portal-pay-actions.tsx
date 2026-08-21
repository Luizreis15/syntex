"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Ações de pagamento no portal empresa — sem baixa manual / forçar pago. */
export function PortalPayActions({
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
  const canPay = status === "pendente" || status === "vencido";

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
      setError(typeof json.error === "string" ? json.error : "Falha ao gerar pagamento.");
      return;
    }
    setMessage(`Pagamento ${billingType} gerado (${json.data.intent.provider}).`);
    router.refresh();
  }

  async function sync() {
    setPending("sync");
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/charges/${chargeId}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    setPending(null);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao sincronizar.");
      return;
    }
    setMessage(`Status: ${json.data.gatewayStatus}`);
    router.refresh();
  }

  if (!canPay && status === "pago") return null;

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <h3 className="text-component font-semibold text-ink">Pagar guia</h3>
      <div className="flex flex-wrap gap-2">
        {!hasIntent && canPay && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => createIntent("pix")}
              className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
            >
              {pending === "pix" ? "Gerando…" : "Pagar com PIX"}
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
        {hasIntent && canPay && (
          <button
            type="button"
            disabled={busy}
            onClick={sync}
            className="h-input rounded-sm border border-border-strong px-3 text-body disabled:opacity-50"
          >
            {pending === "sync" ? "Sincronizando…" : "Já paguei — sincronizar"}
          </button>
        )}
      </div>
      {error && <p className="text-body text-danger">{error}</p>}
      {message && <p className="text-body text-ink-2">{message}</p>}
    </div>
  );
}
