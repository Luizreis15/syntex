"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Option {
  id: string;
  label: string;
}

export function GenerateChargeForm({
  companies,
  rules,
}: {
  companies: Option[];
  rules: Option[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const baseRaw = String(fd.get("calculationBaseAmount") || "");
    const body = {
      companyId: String(fd.get("companyId")),
      contributionRuleId: String(fd.get("contributionRuleId")),
      competence: String(fd.get("competence")),
      calculationBaseAmount: baseRaw ? Number(baseRaw) : undefined,
      dueDate: String(fd.get("dueDate") || "") || undefined,
    };

    const res = await fetch("/api/charges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Não foi possível gerar a cobrança.");
      return;
    }
    router.push(`/cobrancas/${json.data.charge.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div className="space-y-1">
        <label htmlFor="companyId" className="text-label text-ink-3">
          Empresa
        </label>
        <select id="companyId" name="companyId" required className={inputClass}>
          <option value="">Selecione…</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="contributionRuleId" className="text-label text-ink-3">
          Regra de contribuição
        </label>
        <select id="contributionRuleId" name="contributionRuleId" required className={inputClass}>
          <option value="">Selecione…</option>
          {rules.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="competence" className="text-label text-ink-3">
            Competência (YYYY-MM)
          </label>
          <input id="competence" name="competence" required pattern="\d{4}-\d{2}" placeholder="2026-08" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="dueDate" className="text-label text-ink-3">
            Vencimento (opcional)
          </label>
          <input id="dueDate" name="dueDate" type="date" className={inputClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="calculationBaseAmount" className="text-label text-ink-3">
          Base de cálculo em R$ (obrigatória se a regra for percentual)
        </label>
        <input
          id="calculationBaseAmount"
          name="calculationBaseAmount"
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
        />
      </div>
      {error && <p className="text-body text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Gerando…" : "Gerar obrigação e cobrança"}
      </button>
    </form>
  );
}

const inputClass =
  "h-input w-full rounded-sm border border-border bg-surface px-2 text-body text-ink";
