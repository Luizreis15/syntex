"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Option {
  id: string;
  label: string;
}

/**
 * Cadastro operacional de empresa (área Cadastro) — PT-BR, blocos Veramo.
 */
export function CreateCompanyForm({
  branches,
  cnaes,
}: {
  branches: Option[];
  cnaes: Option[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [inviteHint, setInviteHint] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInviteHint(null);
    const fd = new FormData(e.currentTarget);

    const body = {
      legalName: String(fd.get("legalName") || ""),
      tradeName: String(fd.get("tradeName") || "") || undefined,
      cnpj: String(fd.get("cnpj") || ""),
      primaryCnaeId: String(fd.get("primaryCnaeId") || "") || undefined,
      branchId: String(fd.get("branchId") || "") || undefined,
      phone: String(fd.get("phone") || "") || undefined,
      addressZip: String(fd.get("addressZip") || "") || undefined,
      addressStreet: String(fd.get("addressStreet") || "") || undefined,
      addressNeighborhood: String(fd.get("addressNeighborhood") || "") || undefined,
      addressCity: String(fd.get("addressCity") || "") || undefined,
      addressState: String(fd.get("addressState") || "") || undefined,
      accountResponsibleName: String(fd.get("accountResponsibleName") || ""),
      accountResponsibleEmail: String(fd.get("accountResponsibleEmail") || ""),
    };

    const res = await fetch("/api/companies/with-master", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Não foi possível cadastrar a empresa. Confira os campos.";
      setError(msg);
      return;
    }

    if (json.data?.inviteToken) {
      setInviteHint(
        `Convite gerado para ${body.accountResponsibleEmail}. Token (DEV): ${json.data.inviteToken}`,
      );
    }
    router.push(`/empresas/${json.data.company.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <p className="text-body text-ink-2">
        Cadastro de empresa do setor. O responsável pela conta recebe acesso ao portal da empresa
        (espelho do que o sindicato registra).
      </p>

      <fieldset className="space-y-3">
        <legend className="text-component font-semibold text-ink">Identificação</legend>
        <Field label="CNPJ" name="cnpj" required placeholder="00.000.000/0000-00" />
        <Field label="Razão social" name="legalName" required />
        <Field label="Nome fantasia" name="tradeName" />
        <Field label="CNAE principal" name="primaryCnaeId">
          <select id="primaryCnaeId" name="primaryCnaeId" className={inputClass}>
            <option value="">—</option>
            {cnaes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unidade sindical responsável" name="branchId">
          <select id="branchId" name="branchId" className={inputClass}>
            <option value="">—</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-component font-semibold text-ink">Contato e endereço</legend>
        <Field label="Telefone" name="phone" placeholder="(11) 0000-0000" />
        <Field label="CEP" name="addressZip" placeholder="00000-000" />
        <Field label="Logradouro" name="addressStreet" />
        <Field label="Bairro" name="addressNeighborhood" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Cidade" name="addressCity" />
          <Field label="UF" name="addressState" placeholder="SP" />
          <div />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-component font-semibold text-ink">Responsável pela conta</legend>
        <p className="text-label text-ink-3">
          Pessoa que acessa o portal da empresa. Recebe convite por e-mail (token em DEV).
        </p>
        <Field label="Nome do responsável" name="accountResponsibleName" required />
        <Field
          label="E-mail do responsável"
          name="accountResponsibleEmail"
          type="email"
          required
        />
      </fieldset>

      <p className="text-label text-ink-3">
        Ao salvar, a matriz é criada automaticamente com o mesmo CNPJ da empresa.
      </p>

      {error && <p className="text-body text-danger">{error}</p>}
      {inviteHint && (
        <p className="break-all rounded-sm border border-border bg-surface-2 p-3 font-mono text-label text-ink-2">
          {inviteHint}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Cadastrar empresa"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  children,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-label text-ink-3">
        {label}
      </label>
      {children ?? (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

const inputClass =
  "h-input w-full rounded-sm border border-border bg-surface px-2 text-body text-ink";
