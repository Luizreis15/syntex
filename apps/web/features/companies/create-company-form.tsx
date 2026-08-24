"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SyntexField } from "@/components/ui/syntex-field";

interface Option {
  id: string;
  label: string;
}

/**
 * Cadastro operacional de empresa (área Cadastro) — PT-BR, blocos Veramo.
 * Todo campo é `SyntexField`: nenhum <input>/<select> local, nenhuma classe
 * de estilo solta na tela (design/SYNTEX-UI.md §9, prompt 02.2).
 */
export function CreateCompanyForm({
  branches,
  cnaes,
  municipalities = [],
}: {
  branches: Option[];
  cnaes: Option[];
  municipalities?: Option[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [inviteHint, setInviteHint] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [primaryCnaeId, setPrimaryCnaeId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");

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
      municipalityId: municipalityId || undefined,
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

  const cnaeOptions = [{ value: "", label: "—" }, ...cnaes.map((c) => ({ value: c.id, label: c.label }))];
  const branchOptions = [{ value: "", label: "—" }, ...branches.map((b) => ({ value: b.id, label: b.label }))];
  const municipalityOptions = [
    { value: "", label: "—" },
    ...municipalities.map((m) => ({ value: m.id, label: m.label })),
  ];

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-10">
      <p className="text-body text-ink-2">
        Cadastro de empresa do setor. O responsável pela conta recebe acesso ao portal da empresa
        (espelho do que o sindicato registra).
      </p>

      <section className="space-y-4">
        <h2 className="text-section font-semibold text-ink">Identificação</h2>
        <div className="flex flex-wrap gap-4">
          <SyntexField variant="input" label="CNPJ" name="cnpj" required mono width="md" placeholder="00.000.000/0000-00" />
          <SyntexField variant="input" label="Razão social" name="legalName" required width="full" />
          <SyntexField variant="input" label="Nome fantasia" name="tradeName" width="lg" />
          <SyntexField
            variant="select"
            label="CNAE principal"
            name="primaryCnaeId"
            value={primaryCnaeId}
            onValueChange={setPrimaryCnaeId}
            options={cnaeOptions}
            width="lg"
          />
          <SyntexField
            variant="select"
            label="Município da matriz"
            name="municipalityId"
            value={municipalityId}
            onValueChange={setMunicipalityId}
            options={municipalityOptions}
            width="lg"
          />
          <SyntexField
            variant="select"
            label="Unidade sindical responsável"
            name="branchId"
            value={branchId}
            onValueChange={setBranchId}
            options={branchOptions}
            width="md"
          />
        </div>
        <p className="text-label text-ink-3">
          O município da matriz é usado na resolução de representação e CCT. Recomendado.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-section font-semibold text-ink">Contato e endereço</h2>
        <div className="flex flex-wrap gap-4">
          <SyntexField variant="input" label="Telefone" name="phone" mono width="sm" placeholder="(11) 0000-0000" />
          <SyntexField variant="input" label="CEP" name="addressZip" mono width="sm" placeholder="00000-000" />
          <SyntexField variant="input" label="Logradouro" name="addressStreet" width="full" />
          <SyntexField variant="input" label="Bairro" name="addressNeighborhood" width="md" />
          <SyntexField variant="input" label="Cidade" name="addressCity" width="md" />
          <SyntexField variant="input" label="UF" name="addressState" width="xs" mono placeholder="SP" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-section font-semibold text-ink">Responsável pela conta</h2>
        <p className="text-label text-ink-3">
          Pessoa que acessa o portal da empresa. Recebe convite por e-mail (token em DEV).
        </p>
        <div className="flex flex-wrap gap-4">
          <SyntexField variant="input" label="Nome do responsável" name="accountResponsibleName" required width="lg" />
          <SyntexField
            variant="input"
            label="E-mail do responsável"
            name="accountResponsibleEmail"
            type="email"
            required
            width="lg"
          />
        </div>
      </section>

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
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink hover:bg-petrol-700 disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Cadastrar empresa"}
      </button>
    </form>
  );
}
