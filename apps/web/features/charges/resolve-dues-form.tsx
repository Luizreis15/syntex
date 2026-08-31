"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { formatMoeda } from "@/lib/formatters/moeda";

interface DueRow {
  contributionRuleId: string;
  rule: { type: string; value_type: string; value: number; calculation_base: string };
  agreement: { mediador_number: string | null; kind: string } | null;
  amount: number | null;
  needsCalculationBase: boolean;
  existingChargeId: string | null;
  representationStatus: string;
}

interface Option {
  id: string;
  label: string;
}

export function ResolveDuesForm({
  companies,
  initialCompanyId = "",
}: {
  companies: Option[];
  /** Pré-seleção vinda de `/cobrancas/resolver?companyId=` (atalho demo). */
  initialCompanyId?: string;
}) {
  const router = useRouter();
  const [dues, setDues] = useState<DueRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [companyId, setCompanyId] = useState(() =>
    initialCompanyId && companies.some((c) => c.id === initialCompanyId) ? initialCompanyId : "",
  );
  const [competence, setCompetence] = useState("");
  const [base, setBase] = useState("");

  async function resolve(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const params = new URLSearchParams({ companyId, competence });
    if (base) params.set("base", base);
    const res = await fetch(`/api/dues?${params}`);
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao resolver.");
      setDues(null);
      return;
    }
    setDues(json.data);
  }

  async function generate() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        competence,
        calculationBaseAmount: base ? Number(base) : undefined,
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao gerar.");
      return;
    }
    const firstCharge = (json.data as { chargeId?: string }[]).find((r) => r.chargeId)?.chargeId;
    if (firstCharge) {
      router.push(`/cobrancas/${firstCharge}`);
    } else {
      router.push("/cobrancas");
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={resolve} className="max-w-xl space-y-3">
        <div className="space-y-1">
          <label htmlFor="companyId" className="text-label text-ink-3">
            Empresa
          </label>
          <select
            id="companyId"
            required
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="competence" className="text-label text-ink-3">
              Competência
            </label>
            <input
              id="competence"
              type="month"
              required
              value={competence}
              onChange={(e) => setCompetence(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="base" className="text-label text-ink-3">
              Base de cálculo (R$)
            </label>
            <input
              id="base"
              type="number"
              step="0.01"
              min="0"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className={inputClass}
            />
            <p className="text-label text-ink-3">Preencha somente quando a contribuição for percentual.</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-input rounded-sm border border-border-strong px-3 text-body disabled:opacity-50"
        >
          {pending ? "Calculando…" : "Calcular cobrança"}
        </button>
      </form>

      {error && <p className="text-body text-danger">{error}</p>}

      {dues && (
        <div className="space-y-3">
          <h2 className="text-component font-semibold text-ink">
            {dues.length === 0
              ? "Nenhuma cobrança aplicável nesta competência"
              : `${dues.length} cobrança(s) encontrada(s)`}
          </h2>
          {dues.length > 0 && (
            <>
              <table className="w-full border-collapse text-left text-body" aria-label="Débitos">
                <thead>
                  <tr className="border-b border-border text-label uppercase text-ink-3">
                    <th className="py-2 pr-3 font-medium">Regra</th>
                    <th className="py-2 pr-3 font-medium">CCT</th>
                    <th className="py-2 pr-3 font-medium">Valor</th>
                    <th className="py-2 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {dues.map((d) => (
                    <tr key={d.contributionRuleId} className="border-b border-border">
                      <td className="py-2.5 pr-3">
                        {d.rule.type} · {d.rule.calculation_base}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-ink-2">
                        {d.agreement?.mediador_number ?? d.agreement?.kind ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 font-mono">
                        {d.needsCalculationBase
                          ? "informe a base"
                          : d.amount != null
                            ? formatMoeda(d.amount)
                            : "—"}
                      </td>
                      <td className="py-2.5">
                        {d.existingChargeId ? (
                          <Link href={`/cobrancas/${d.existingChargeId}`} className="text-petrol-700 hover:underline">
                            já gerada
                          </Link>
                        ) : (
                          <span className="text-ink-2">pendente · {d.representationStatus}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                disabled={pending || dues.every((d) => d.existingChargeId || d.needsCalculationBase)}
                onClick={generate}
                className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
              >
                {dues.filter((d) => !d.existingChargeId).length === 1
                  ? "Gerar cobrança"
                  : "Gerar cobranças"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "h-input w-full rounded-sm border border-border bg-surface px-2 text-body text-ink";
