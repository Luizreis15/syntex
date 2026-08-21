"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddContributionRuleForm({ agreementId }: { agreementId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      collectiveAgreementId: agreementId,
      type: String(fd.get("type")),
      validFrom: String(fd.get("validFrom")),
      validUntil: String(fd.get("validUntil") || "") || null,
      calculationBase: String(fd.get("calculationBase")),
      valueType: String(fd.get("valueType")),
      value: Number(fd.get("value")),
    };

    const res = await fetch("/api/contribution-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Não foi possível salvar a regra.");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-sm border border-border bg-surface-2 p-4">
      <h3 className="text-component font-semibold text-ink">Nova regra de contribuição</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo" name="type">
          <select name="type" required className={inputClass}>
            <option value="mensalidade">mensalidade</option>
            <option value="assistencial">assistencial</option>
            <option value="confederativa">confederativa</option>
            <option value="negocial">negocial</option>
          </select>
        </Field>
        <Field label="Tipo de valor" name="valueType">
          <select name="valueType" required className={inputClass}>
            <option value="percentual">percentual</option>
            <option value="valor_fixo">valor fixo</option>
          </select>
        </Field>
        <Field label="Vigência início" name="validFrom">
          <input name="validFrom" type="date" required className={inputClass} />
        </Field>
        <Field label="Vigência fim (opcional)" name="validUntil">
          <input name="validUntil" type="date" className={inputClass} />
        </Field>
        <Field label="Base de cálculo" name="calculationBase">
          <input
            name="calculationBase"
            required
            placeholder="ex.: salário base mensal"
            className={inputClass}
          />
        </Field>
        <Field label="Valor" name="value">
          <input name="value" type="number" step="0.0001" min="0" required className={inputClass} />
        </Field>
      </div>
      {error && <p className="text-body text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Adicionar regra"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  children,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
}) {
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
