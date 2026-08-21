"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Option {
  id: string;
  label: string;
}

export function CreateWorkerForm({
  companies,
  branches,
}: {
  companies: Option[];
  branches: Option[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const membershipStatus = String(fd.get("membershipStatus") || "");
    const companyId = String(fd.get("companyId") || "");
    const body = {
      cpf: String(fd.get("cpf")),
      fullName: String(fd.get("fullName")),
      socialName: String(fd.get("socialName") || "") || undefined,
      email: String(fd.get("email") || "") || undefined,
      phone: String(fd.get("phone") || "") || undefined,
      branchId: String(fd.get("branchId") || "") || undefined,
      registrationNumber: String(fd.get("registrationNumber") || "") || undefined,
      membershipStatus: membershipStatus || undefined,
      membershipValidFrom: String(fd.get("membershipValidFrom") || "") || undefined,
      companyId: companyId || undefined,
      employmentValidFrom: String(fd.get("employmentValidFrom") || "") || undefined,
      jobTitle: String(fd.get("jobTitle") || "") || undefined,
    };

    const res = await fetch("/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Não foi possível cadastrar.");
      return;
    }
    router.push(`/trabalhadores/${json.data.worker.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <fieldset className="space-y-3">
        <legend className="text-component font-semibold text-ink">Pessoa</legend>
        <Field label="CPF" name="cpf">
          <input id="cpf" name="cpf" required placeholder="000.000.000-00" className={inputClass} />
        </Field>
        <Field label="Nome completo" name="fullName">
          <input id="fullName" name="fullName" required className={inputClass} />
        </Field>
        <Field label="Nome social (opcional)" name="socialName">
          <input id="socialName" name="socialName" className={inputClass} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="E-mail" name="email">
            <input id="email" name="email" type="email" className={inputClass} />
          </Field>
          <Field label="Telefone" name="phone">
            <input id="phone" name="phone" className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-component font-semibold text-ink">Trabalhador</legend>
        <Field label="Unidade" name="branchId">
          <select id="branchId" name="branchId" className={inputClass}>
            <option value="">—</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Matrícula (opcional)" name="registrationNumber">
          <input id="registrationNumber" name="registrationNumber" className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-component font-semibold text-ink">Filiação (dado sensível)</legend>
        <Field label="Status inicial" name="membershipStatus">
          <select id="membershipStatus" name="membershipStatus" className={inputClass}>
            <option value="">Sem filiação agora</option>
            <option value="prospect">prospect</option>
            <option value="ativo">ativo</option>
            <option value="suspenso">suspenso</option>
          </select>
        </Field>
        <Field label="Data de associação" name="membershipValidFrom">
          <input id="membershipValidFrom" name="membershipValidFrom" type="date" className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-component font-semibold text-ink">Vínculo empregatício (opcional)</legend>
        <Field label="Empresa" name="companyId">
          <select id="companyId" name="companyId" className={inputClass}>
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Início" name="employmentValidFrom">
            <input id="employmentValidFrom" name="employmentValidFrom" type="date" className={inputClass} />
          </Field>
          <Field label="Cargo" name="jobTitle">
            <input id="jobTitle" name="jobTitle" className={inputClass} />
          </Field>
        </div>
      </fieldset>

      {error && <p className="text-body text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Cadastrar trabalhador"}
      </button>
    </form>
  );
}

function Field({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-label text-ink-3">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "h-input w-full rounded-sm border border-border bg-surface px-2 text-body text-ink";
