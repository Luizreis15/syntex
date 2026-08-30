"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RepresentationBasis } from "@syntex/types";
import { SyntexField } from "@/components/ui/syntex-field";
import {
  SyntexPanel,
  SyntexPanelBody,
  SyntexPanelDescription,
  SyntexPanelHeader,
  SyntexPanelTitle,
} from "@/components/ui/syntex-panel";
import { representationBasisLabel } from "@/features/representations/basis-label";
import type { RepresentationListStatus } from "@/features/representations/data";

const BASIS_OPTIONS: RepresentationBasis[] = [
  "cnae",
  "cct_registrada",
  "decisao_judicial",
  "carta_sindical",
  "manual",
];

export interface ClaimRegistrationOption {
  id: string;
  registryNumber: string;
  label: string;
}

export function ClaimRepresentationForm({
  establishmentId,
  currentStatus,
  hasActiveClaims,
  defaultValidFrom,
  registrations,
}: {
  establishmentId: string;
  currentStatus: RepresentationListStatus;
  hasActiveClaims: boolean;
  defaultValidFrom: string;
  registrations: ClaimRegistrationOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState("");
  const [basis, setBasis] = useState<RepresentationBasis>("carta_sindical");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setOkMessage(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      establishmentId,
      unionRegistrationId: registrationId || null,
      validFrom: String(fd.get("validFrom") || defaultValidFrom),
      basis,
      evidence: String(fd.get("evidence") || "").trim(),
    };

    const res = await fetch("/api/representations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) {
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Não foi possível incluir na base.";
      setError(msg);
      return;
    }

    setOkMessage(
      json.duplicate
        ? "Inclusão equivalente já vigente — nenhuma linha nova criada."
        : "Incluído na base como pendente.",
    );
    setOpen(false);
    setRegistrationId("");
    setBasis("carta_sindical");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  const impact =
    hasActiveClaims || currentStatus !== "sem_representacao"
      ? "Já existe registro vigente para este estabelecimento. Nova inclusão fica pendente até ativação."
      : "Este estabelecimento entrará na base como pendente — cobrança só após ativar.";

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
            setOkMessage(null);
          }}
          className="inline-flex h-10 items-center rounded-control bg-petrol-700 px-3.5 text-label font-bold text-shell-ink transition-colors hover:bg-petrol-600"
        >
          Incluir na base
        </button>
      ) : null}

      {okMessage ? <p className="text-dense font-medium text-success">{okMessage}</p> : null}

      {open ? (
        <SyntexPanel variant="raised" rail="amber">
          <SyntexPanelHeader>
            <div>
              <SyntexPanelTitle>Incluir na base</SyntexPanelTitle>
              <SyntexPanelDescription>{impact}</SyntexPanelDescription>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-label font-semibold text-ink-3 hover:text-ink"
            >
              Cancelar
            </button>
          </SyntexPanelHeader>
          <SyntexPanelBody className="px-5 py-4">
            <form onSubmit={onSubmit} className="space-y-3">
              <SyntexField
                variant="select"
                label="Registro sindical"
                name="unionRegistrationId"
                value={registrationId}
                onValueChange={setRegistrationId}
                options={[
                  { value: "", label: "— sem registro vinculado —" },
                  ...registrations.map((r) => ({ value: r.id, label: r.label })),
                ]}
              />
              <SyntexField
                variant="select"
                label="Base"
                name="basis"
                required
                value={basis}
                onValueChange={(v) => setBasis(v as RepresentationBasis)}
                options={BASIS_OPTIONS.map((b) => ({
                  value: b,
                  label: representationBasisLabel(b),
                }))}
              />
              <SyntexField
                variant="input"
                type="date"
                label="Data inicial"
                name="validFrom"
                required
                width="sm"
                defaultValue={defaultValidFrom}
              />
              <div className="flex flex-col gap-1">
                <label htmlFor="evidence" className="text-label uppercase text-ink-3">
                  Evidência <span className="text-status-disputada">*</span>
                </label>
                <textarea
                  id="evidence"
                  name="evidence"
                  required
                  rows={4}
                  className="w-full rounded-control border border-border bg-surface px-2.5 py-2 text-body text-ink outline-none placeholder:text-ink-3 focus-visible:border-petrol-600"
                  placeholder="Observação opcional sobre o enquadramento (CNAE, visita, etc.)…"
                />
              </div>

              <p className="text-label text-ink-3">
                Incluir como pendente não gera cobrança. Só status ativa habilita CCT e dues.
              </p>

              {error ? <p className="text-dense font-medium text-danger">{error}</p> : null}

              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-10 items-center rounded-control bg-petrol-700 px-3.5 text-label font-bold text-shell-ink transition-colors hover:bg-petrol-600 disabled:opacity-60"
              >
                {pending ? "Incluindo…" : "Incluir como pendente"}
              </button>
            </form>
          </SyntexPanelBody>
        </SyntexPanel>
      ) : null}
    </div>
  );
}
