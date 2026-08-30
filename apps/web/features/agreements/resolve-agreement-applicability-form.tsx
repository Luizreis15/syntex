import { representationStatusLabel } from "@/lib/domain/representation-status-label";
"use client";

import Link from "next/link";
import { useState } from "react";
import { SyntexField } from "@/components/ui/syntex-field";

interface Option {
  id: string;
  label: string;
}

interface ResolveResult {
  status: string;
  agreement: {
    id: string;
    kind: string;
    mediador_number: string | null;
    valid_from: string;
    valid_until: string;
  } | null;
  contributionRules: { id: string; type: string }[];
  basis: string | null;
}

/**
 * B2 — “qual acordo vale na data” para um estabelecimento.
 * Usa GET /api/nxt/resolve (só com representation.read).
 */
export function ResolveAgreementApplicabilityForm({
  establishments,
  defaultDate,
}: {
  establishments: Option[];
  defaultDate: string;
}) {
  const apiBasePath = "/api/representations";
  const [establishmentId, setEstablishmentId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResolveResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    const params = new URLSearchParams({ establishmentId, date });
    const res = await fetch(`${apiBasePath}/resolve?${params}`);
    const json = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao resolver aplicabilidade.");
      return;
    }
    setResult(json.data as ResolveResult);
  }

  const options = [
    { value: "", label: "Selecione o estabelecimento…" },
    ...establishments.map((e) => ({ value: e.id, label: e.label })),
  ];

  return (
    <section className="space-y-3 rounded-control border border-border/60 bg-surface-2/30 px-4 py-4">
      <div>
        <h2 className="text-component font-semibold text-ink">Resolver aplicabilidade</h2>
        <p className="mt-1 text-dense text-ink-2">
          Dado estabelecimento + data, responde o status da representação e a CCT/ACT só se estiver{" "}
          <span className="font-medium text-ink">ativa</span>.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <SyntexField
          variant="select"
          label="Estabelecimento"
          name="establishmentId"
          required
          value={establishmentId}
          onValueChange={setEstablishmentId}
          options={options}
          width="lg"
        />
        <SyntexField
          variant="input"
          type="date"
          label="Data"
          name="date"
          required
          width="sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          type="submit"
          disabled={pending || !establishmentId}
          className="inline-flex h-10 items-center rounded-control bg-petrol-700 px-3.5 text-label font-bold text-shell-ink disabled:opacity-60"
        >
          {pending ? "Resolvendo…" : "Resolver"}
        </button>
      </form>

      {error ? <p className="text-dense font-medium text-danger">{error}</p> : null}

      {result ? (
        <div className="space-y-2 rounded-control border border-border bg-paper px-4 py-3 text-body">
          <p>
            Status da representação:{" "}
            <span className="font-semibold text-ink">{representationStatusLabel(result.status)}</span>
            {result.basis ? <span className="text-ink-2"> · base {result.basis}</span> : null}
          </p>
          {result.status !== "reconhecida" ? (
            <p className="text-dense text-ink-2">
              CCT/ACT automática só é elegível com representação ativa (ADR-021).
            </p>
          ) : null}
          {result.agreement ? (
            <p>
              Acordo aplicável:{" "}
              <span className="font-medium">
                {result.agreement.kind.toUpperCase()}
                {result.agreement.mediador_number
                  ? ` · Mediador ${result.agreement.mediador_number}`
                  : ""}
              </span>
              <span className="ml-1 font-mono text-dense text-ink-3">
                {result.agreement.valid_from} → {result.agreement.valid_until}
              </span>
              {result.contributionRules.length > 0 ? (
                <span className="text-ink-2">
                  {" "}
                  · {result.contributionRules.length} regra(s) na data
                </span>
              ) : null}
            </p>
          ) : result.status === "reconhecida" ? (
            <p className="text-dense text-ink-2">
              Representação ativa, mas nenhuma CCT/ACT casa categorias/território nesta data.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={`/representacao/${establishmentId}`}
              className="text-label font-semibold text-petrol-700 hover:underline"
            >
              Abrir workspace de representação
            </Link>
            {result.agreement ? (
              <Link
                href={`/convencoes/${result.agreement.id}?date=${date}`}
                className="text-label font-semibold text-petrol-700 hover:underline"
              >
                Abrir convenção
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
