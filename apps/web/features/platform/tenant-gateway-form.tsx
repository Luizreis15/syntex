"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PROVIDERS = [
  { value: "stub", label: "Stub (dev)" },
  { value: "asaas", label: "Asaas" },
  { value: "itau_bolecode", label: "Itaú Bolecode" },
] as const;

export function TenantGatewayForm({
  tenantId,
  initial,
}: {
  tenantId: string;
  initial: {
    defaultChargeProvider: string;
    itauBeneficiarioId: string;
    itauPixKey: string;
    itauCarteiraCode: string;
  };
}) {
  const router = useRouter();
  const [provider, setProvider] = useState(initial.defaultChargeProvider);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setOk(false);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/platform/tenants/${tenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultChargeProvider: fd.get("defaultChargeProvider"),
        itauBeneficiarioId: fd.get("itauBeneficiarioId") || null,
        itauPixKey: fd.get("itauPixKey") || null,
        itauCarteiraCode: fd.get("itauCarteiraCode") || null,
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao salvar.");
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-3">
      <div className="space-y-1">
        <label htmlFor="defaultChargeProvider" className="text-label text-ink-3">
          Provider padrão
        </label>
        <select
          id="defaultChargeProvider"
          name="defaultChargeProvider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {provider === "itau_bolecode" && (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-label text-ink-3">
            Campos Itaú (sem hardcode de tenant — config por sindicato).
          </p>
          <Field
            label="Beneficiário ID"
            name="itauBeneficiarioId"
            defaultValue={initial.itauBeneficiarioId}
            mono
          />
          <Field label="Chave PIX" name="itauPixKey" defaultValue={initial.itauPixKey} mono />
          <Field
            label="Carteira"
            name="itauCarteiraCode"
            defaultValue={initial.itauCarteiraCode}
            mono
            placeholder="109"
          />
        </div>
      )}

      {provider !== "itau_bolecode" && (
        <>
          <input type="hidden" name="itauBeneficiarioId" value="" />
          <input type="hidden" name="itauPixKey" value="" />
          <input type="hidden" name="itauCarteiraCode" value="" />
        </>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Salvar gateway"}
      </button>
      {error && <p className="text-body text-danger">{error}</p>}
      {ok && <p className="text-body text-ink-2">Gateway atualizado.</p>}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  mono,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-label text-ink-3">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`h-input w-full rounded-sm border border-border bg-surface px-2 text-body ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}
