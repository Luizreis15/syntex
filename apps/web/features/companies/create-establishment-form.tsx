"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SyntexField } from "@/components/ui/syntex-field";

interface Option {
  id: string;
  label: string;
}

/**
 * Novo estabelecimento no fluxo da Empresa 360 (B1).
 * POST /api/establishments — municipality/CNAE para cadeia de representação.
 */
export function CreateEstablishmentForm({
  companyId,
  municipalities,
  cnaes,
  defaultKind = "filial",
}: {
  companyId: string;
  municipalities: Option[];
  cnaes: Option[];
  defaultKind?: "matriz" | "filial";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<"matriz" | "filial">(defaultKind);
  const [cnaeId, setCnaeId] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const body = {
      companyId,
      cnpj: String(fd.get("cnpj") || ""),
      kind,
      cnaeId: cnaeId || undefined,
      municipalityId: municipalityId || undefined,
    };

    const res = await fetch("/api/establishments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) {
      setError(
        typeof json.error === "string"
          ? json.error
          : "Não foi possível cadastrar o estabelecimento.",
      );
      return;
    }

    setOpen(false);
    setCnaeId("");
    setMunicipalityId("");
    setKind(defaultKind);
    (e.target as HTMLFormElement).reset();
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
        Novo estabelecimento
      </button>
    );
  }

  const munOptions = [
    { value: "", label: "— município —" },
    ...municipalities.map((m) => ({ value: m.id, label: m.label })),
  ];
  const cnaeOptions = [
    { value: "", label: "— CNAE —" },
    ...cnaes.map((c) => ({ value: c.id, label: c.label })),
  ];

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-control border border-border/60 bg-surface-2/40 px-4 py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-component font-semibold text-ink">Novo estabelecimento</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-label font-semibold text-ink-3 hover:text-ink"
        >
          Cancelar
        </button>
      </div>
      <p className="text-dense text-ink-2">
        Município e CNAE alimentam a resolução de representação e CCT. Preferível preencher ambos.
      </p>
      <div className="flex flex-wrap gap-3">
        <SyntexField
          variant="input"
          label="CNPJ"
          name="cnpj"
          required
          mono
          width="md"
          placeholder="00.000.000/0000-00"
        />
        <SyntexField
          variant="select"
          label="Tipo"
          name="kind"
          required
          value={kind}
          onValueChange={(v) => setKind(v as "matriz" | "filial")}
          options={[
            { value: "filial", label: "Filial" },
            { value: "matriz", label: "Matriz" },
          ]}
          width="sm"
        />
        <SyntexField
          variant="select"
          label="Município"
          name="municipalityId"
          value={municipalityId}
          onValueChange={setMunicipalityId}
          options={munOptions}
          width="lg"
        />
        <SyntexField
          variant="select"
          label="CNAE"
          name="cnaeId"
          value={cnaeId}
          onValueChange={setCnaeId}
          options={cnaeOptions}
          width="lg"
        />
      </div>
      {error ? <p className="text-dense font-medium text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center rounded-control bg-petrol-700 px-3 text-label font-bold text-shell-ink disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Cadastrar estabelecimento"}
      </button>
    </form>
  );
}
