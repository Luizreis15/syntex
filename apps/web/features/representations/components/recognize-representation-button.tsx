"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RecognizeRepresentationButton({
  representationId,
  hasCompetitors,
}: {
  representationId: string;
  hasCompetitors: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/representations/${representationId}/recognize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) {
      setError(
        typeof json.error === "string"
          ? json.error
          : "Não foi possível ativar a representação.",
      );
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className="inline-flex h-9 items-center rounded-control bg-petrol-700 px-3 text-label font-bold text-shell-ink transition-colors hover:bg-petrol-600"
      >
        Ativar
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-control border border-amber-500/40 bg-amber-500/5 px-3 py-3">
      <p className="text-dense text-ink-2">
        {hasCompetitors
          ? "Ativar encerra registros concorrentes sobrepostos (inativos) e habilita CCT/regras/cobrança."
          : "Ao ativar, este estabelecimento passa a gerar cobrança quando houver regra/CCT aplicável."}
      </p>
      {error ? <p className="text-dense font-medium text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={confirm}
          className="inline-flex h-9 items-center rounded-control bg-petrol-700 px-3 text-label font-bold text-shell-ink disabled:opacity-60"
        >
          {pending ? "Ativando…" : "Confirmar ativação"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(false)}
          className="inline-flex h-9 items-center rounded-control px-3 text-label font-semibold text-ink-3 hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
