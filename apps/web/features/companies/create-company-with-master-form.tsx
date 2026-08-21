"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCompanyWithMasterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [tokenOnce, setTokenOnce] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setTokenOnce(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/companies/with-master", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName: fd.get("legalName"),
        tradeName: fd.get("tradeName") || null,
        cnpj: fd.get("cnpj"),
        masterEmail: fd.get("masterEmail"),
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao criar.");
      return;
    }
    setTokenOnce(json.data.inviteToken as string);
    e.currentTarget.reset();
    router.push(`/empresas/${json.data.company.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3">
      {error && <p className="text-body text-danger">{error}</p>}
      {tokenOnce && (
        <p className="break-all rounded-sm border border-border bg-surface-2 p-3 font-mono text-label">
          Token company_master: {tokenOnce}
        </p>
      )}
      <Field label="Razão social" name="legalName" required />
      <Field label="Nome fantasia" name="tradeName" />
      <Field label="CNPJ" name="cnpj" required />
      <Field label="E-mail do company master" name="masterEmail" type="email" required />
      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Criando…" : "Criar empresa + master"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-label text-ink-3">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
      />
    </div>
  );
}
