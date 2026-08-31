"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SyntexPanel, SyntexPanelBody, SyntexPanelDescription, SyntexPanelHeader, SyntexPanelTitle } from "@/components/ui/syntex-panel";
import {
  AUDIENCE_LABEL,
  CALCULATION_METHOD_LABEL,
  COLLECTION_ROLE_LABEL,
  LIABLE_PARTY_LABEL,
  REVENUE_PLAN_TYPE_LABEL,
  SOURCE_TYPE_LABEL,
} from "@/lib/domain/revenue-plan";
import { formatMoeda } from "@/lib/formatters/moeda";

interface AgreementOption {
  id: string;
  label: string;
  validFrom: string;
  validUntil: string;
}

export function RevenuePlanForm({ agreements }: { agreements: AgreementOption[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<keyof typeof SOURCE_TYPE_LABEL>("collective_agreement");
  const [method, setMethod] = useState<keyof typeof CALCULATION_METHOD_LABEL>("floor_headcount_percentage");
  const [liableParty, setLiableParty] = useState<keyof typeof LIABLE_PARTY_LABEL>("worker");
  const [collectionRole, setCollectionRole] = useState<keyof typeof COLLECTION_ROLE_LABEL>("employer_remittance");
  const [audience, setAudience] = useState<keyof typeof AUDIENCE_LABEL>("represented_workers");
  const [value, setValue] = useState("1");

  const valueContext = useMemo(() => {
    if (method.endsWith("_percentage")) return `${value || "0"}%`;
    return formatMoeda(Number(value || 0));
  }, [method, value]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(event.currentTarget);
    const body = {
      name: String(fd.get("name") ?? ""),
      type: String(fd.get("type")),
      sourceType,
      collectiveAgreementId: sourceType === "collective_agreement" ? String(fd.get("collectiveAgreementId") || "") || null : null,
      clauseReference: String(fd.get("clauseReference") || "") || null,
      liableParty,
      collectionRole,
      audience,
      calculationMethod: method,
      value: Number(value),
      frequency: String(fd.get("frequency")),
      dueDay: Number(fd.get("dueDay")),
      validFrom: String(fd.get("validFrom")),
      validUntil: String(fd.get("validUntil") || "") || null,
      oppositionApplies: fd.get("oppositionApplies") === "on",
      status: String(fd.get("status")),
    };

    const response = await fetch("/api/revenue-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(formatApiError(json.error));
      return;
    }
    router.push("/cobrancas/modelos");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <SyntexPanel variant="raised" rail="teal">
          <SyntexPanelHeader>
            <div>
              <SyntexPanelTitle>Identificação e fundamento</SyntexPanelTitle>
              <SyntexPanelDescription>Defina a receita e o documento que autoriza sua apuração.</SyntexPanelDescription>
            </div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do plano" hint="Ex.: Assistencial SECABC 2026" className="md:col-span-2">
              <input name="name" required minLength={3} className={inputClass} />
            </Field>
            <Field label="Natureza da receita">
              <select name="type" required className={inputClass}>
                {Object.entries(REVENUE_PLAN_TYPE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
            <Field label="Fundamento">
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value as typeof sourceType)} className={inputClass}>
                {Object.entries(SOURCE_TYPE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
            {sourceType === "collective_agreement" ? (
              <Field label="CCT ou ACT" className="md:col-span-2">
                <select name="collectiveAgreementId" required className={inputClass}>
                  <option value="">Selecione o instrumento…</option>
                  {agreements.map((agreement) => <option key={agreement.id} value={agreement.id}>{agreement.label} · {agreement.validFrom} → {agreement.validUntil}</option>)}
                </select>
              </Field>
            ) : null}
            <Field label="Cláusula ou referência" hint="Não inclua dados pessoais." className="md:col-span-2">
              <input name="clauseReference" placeholder="Ex.: cláusula 42 · assembleia de 15/05/2026" className={inputClass} />
            </Field>
          </SyntexPanelBody>
        </SyntexPanel>

        <SyntexPanel variant="standard" rail="blue">
          <SyntexPanelHeader>
            <div>
              <SyntexPanelTitle>Quem paga e quem recolhe</SyntexPanelTitle>
              <SyntexPanelDescription>Separe o responsável econômico da empresa que apenas desconta e repassa.</SyntexPanelDescription>
            </div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="grid gap-4 md:grid-cols-3">
            <Field label="Responsável econômico">
              <select value={liableParty} onChange={(e) => setLiableParty(e.target.value as typeof liableParty)} className={inputClass}>
                {Object.entries(LIABLE_PARTY_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
            <Field label="Forma de recolhimento">
              <select value={collectionRole} onChange={(e) => setCollectionRole(e.target.value as typeof collectionRole)} className={inputClass}>
                {Object.entries(COLLECTION_ROLE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
            <Field label="Público alcançado">
              <select value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} className={inputClass}>
                {Object.entries(AUDIENCE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
          </SyntexPanelBody>
        </SyntexPanel>

        <SyntexPanel variant="standard" rail="green">
          <SyntexPanelHeader>
            <div>
              <SyntexPanelTitle>Como calcular</SyntexPanelTitle>
              <SyntexPanelDescription>O gestor informará apenas os dados exigidos por este método na apuração mensal.</SyntexPanelDescription>
            </div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="grid gap-4 md:grid-cols-2">
            <Field label="Método de apuração" className="md:col-span-2">
              <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={inputClass}>
                {Object.entries(CALCULATION_METHOD_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
            <Field label={method.endsWith("_percentage") ? "Percentual" : "Valor"} hint={method.endsWith("_percentage") ? "Informe 1 para representar 1%." : "Valor em reais."}>
              <div className="relative">
                <input type="number" required min="0.0001" step="0.0001" value={value} onChange={(e) => setValue(e.target.value)} className={`${inputClass} pr-10`} />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-body text-ink-3">{method.endsWith("_percentage") ? "%" : "R$"}</span>
              </div>
            </Field>
            <Field label="Periodicidade">
              <select name="frequency" className={inputClass}>
                <option value="monthly">Mensal</option>
                <option value="single">Cobrança única</option>
              </select>
            </Field>
          </SyntexPanelBody>
        </SyntexPanel>

        <SyntexPanel variant="standard" rail="amber">
          <SyntexPanelHeader>
            <div>
              <SyntexPanelTitle>Calendário e controle</SyntexPanelTitle>
              <SyntexPanelDescription>A vigência limita as competências em que o plano pode ser utilizado.</SyntexPanelDescription>
            </div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Início da vigência"><input name="validFrom" type="date" required className={inputClass} /></Field>
            <Field label="Fim da vigência"><input name="validUntil" type="date" className={inputClass} /></Field>
            <Field label="Vencimento" hint="Dia do mês seguinte"><input name="dueDay" type="number" min="1" max="28" defaultValue="10" required className={inputClass} /></Field>
            <Field label="Situação">
              <select name="status" className={inputClass}><option value="draft">Salvar como rascunho</option><option value="active">Ativar agora</option></select>
            </Field>
            <label className="flex items-start gap-3 rounded-control border border-border bg-surface-inset p-3 sm:col-span-2 lg:col-span-4">
              <input name="oppositionApplies" type="checkbox" className="mt-0.5 size-4 accent-petrol-700" />
              <span><span className="block text-body font-semibold text-ink">Possui direito de oposição</span><span className="text-label text-ink-2">O registro individual das oposições será uma etapa própria; aqui apenas declaramos a regra do plano.</span></span>
            </label>
          </SyntexPanelBody>
        </SyntexPanel>

        {error ? <p role="alert" className="rounded-control bg-red-50 px-4 py-3 text-body text-danger">{error}</p> : null}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24">
        <SyntexPanel variant="dark" rail="teal">
          <SyntexPanelHeader>
            <div><SyntexPanelTitle className="text-white">Resumo do plano</SyntexPanelTitle><SyntexPanelDescription className="text-slate-300">O que o operador verá na apuração.</SyntexPanelDescription></div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="space-y-4 text-body text-slate-200">
            <Summary label="Cálculo" value={CALCULATION_METHOD_LABEL[method]} />
            <Summary label="Taxa ou valor" value={valueContext} />
            <Summary label="Responsável" value={LIABLE_PARTY_LABEL[liableParty]} />
            <Summary label="Recolhimento" value={COLLECTION_ROLE_LABEL[collectionRole]} />
            <Summary label="Público" value={AUDIENCE_LABEL[audience]} />
          </SyntexPanelBody>
        </SyntexPanel>
        <button type="submit" disabled={pending} className="inline-flex h-11 w-full items-center justify-center rounded-control bg-petrol-800 px-4 text-body font-semibold text-white transition hover:bg-petrol-700 disabled:opacity-50">
          {pending ? "Salvando plano…" : "Salvar plano de arrecadação"}
        </button>
        <p className="text-label leading-relaxed text-ink-3">Ative somente depois de conferir fundamento, cálculo e vigência. Planos ativos podem originar obrigações financeiras.</p>
      </aside>
    </form>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return <label className={`space-y-1.5 ${className}`}><span className="block text-label font-semibold text-ink-2">{label}</span>{children}{hint ? <span className="block text-label text-ink-3">{hint}</span> : null}</label>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-white/10 pb-3 last:border-0 last:pb-0"><p className="text-label uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-medium text-white">{value}</p></div>;
}

function formatApiError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "fieldErrors" in error) {
    const fields = Object.values((error as { fieldErrors: Record<string, string[]> }).fieldErrors).flat();
    if (fields[0]) return fields[0];
  }
  return "Não foi possível salvar o plano. Revise os campos e tente novamente.";
}

const inputClass = "h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-ink outline-none transition hover:border-border-strong focus:border-petrol-600 focus:ring-2 focus:ring-petrol-100";

