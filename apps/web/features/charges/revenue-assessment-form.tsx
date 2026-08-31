"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SyntexPanel, SyntexPanelBody, SyntexPanelDescription, SyntexPanelHeader, SyntexPanelTitle } from "@/components/ui/syntex-panel";
import { SyntexAccentFrame } from "@/components/ui/syntex-accent-rail";
import { formatMoeda } from "@/lib/formatters/moeda";
import {
  AUDIENCE_LABEL,
  CALCULATION_METHOD_LABEL,
  COLLECTION_ROLE_LABEL,
  REVENUE_PLAN_TYPE_LABEL,
  calculateContributionAssessment,
  type AssessmentCalculation,
  type RevenuePlanView,
} from "@/lib/domain/revenue-plan";

interface EstablishmentOption {
  id: string;
  label: string;
}

interface CompanyOption {
  id: string;
  label: string;
  establishments: EstablishmentOption[];
}

export function RevenueAssessmentForm({
  plans,
  companies,
  initialPlanId = "",
  initialCompanyId = "",
  canWrite,
}: {
  plans: RevenuePlanView[];
  companies: CompanyOption[];
  initialPlanId?: string;
  initialCompanyId?: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [planId, setPlanId] = useState(() => plans.some((p) => p.id === initialPlanId) ? initialPlanId : "");
  const [companyId, setCompanyId] = useState(() => companies.some((c) => c.id === initialCompanyId) ? initialCompanyId : "");
  const [establishmentId, setEstablishmentId] = useState("");
  const [competence, setCompetence] = useState(new Date().toISOString().slice(0, 7));
  const [headcount, setHeadcount] = useState("");
  const [headcountSource, setHeadcountSource] = useState("finance_confirmed");
  const [categoryFloor, setCategoryFloor] = useState("");
  const [declaredPayroll, setDeclaredPayroll] = useState("");
  const [preview, setPreview] = useState<AssessmentCalculation | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((item) => item.id === planId) ?? null;
  const company = companies.find((item) => item.id === companyId) ?? null;
  const requiresEstablishment = plan?.source_type === "collective_agreement";
  const requiresHeadcount = plan?.calculation_method === "floor_headcount_percentage" || plan?.calculation_method === "fixed_per_worker";
  const requiresFloor = plan?.calculation_method === "floor_headcount_percentage";
  const requiresPayroll = plan?.calculation_method === "declared_payroll_percentage";

  const readyForPreview = Boolean(
    plan && company && competence &&
    (!requiresEstablishment || establishmentId) &&
    (!requiresHeadcount || Number(headcount) > 0) &&
    (!requiresFloor || Number(categoryFloor) > 0) &&
    (!requiresPayroll || Number(declaredPayroll) > 0),
  );

  const planContext = useMemo(() => plan ? [
    REVENUE_PLAN_TYPE_LABEL[plan.type],
    CALCULATION_METHOD_LABEL[plan.calculation_method],
    COLLECTION_ROLE_LABEL[plan.collection_role],
  ] : [], [plan]);

  function resetResult() {
    setPreview(null);
    setAssessmentId(null);
    setError(null);
  }

  function calculate() {
    if (!plan) return;
    setError(null);
    try {
      setPreview(calculateContributionAssessment(plan, {
        headcount: headcount ? Number(headcount) : null,
        categoryFloor: categoryFloor ? Number(categoryFloor) : null,
        declaredPayroll: declaredPayroll ? Number(declaredPayroll) : null,
      }));
      setAssessmentId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "não foi possível calcular");
    }
  }

  async function confirmAssessment() {
    if (!preview || !plan) return;
    setPending(true);
    setError(null);
    const response = await fetch("/api/contribution-assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revenuePlanId: plan.id,
        companyId,
        establishmentId: establishmentId || null,
        competence,
        headcount: headcount ? Number(headcount) : null,
        headcountSource: headcount ? headcountSource : null,
        categoryFloor: categoryFloor ? Number(categoryFloor) : null,
        declaredPayroll: declaredPayroll ? Number(declaredPayroll) : null,
      }),
    });
    const json = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(typeof json.error === "string" ? json.error : "não foi possível confirmar a apuração");
      return;
    }
    setAssessmentId(json.data.id);
  }

  async function generateCharge() {
    if (!assessmentId) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/contribution-assessments/${assessmentId}/charge`, { method: "POST" });
    const json = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(typeof json.error === "string" ? json.error : "não foi possível gerar a cobrança");
      return;
    }
    if (json.data.chargeId) router.push(`/cobrancas/${json.data.chargeId}`);
    else router.push("/cobrancas");
    router.refresh();
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <SyntexPanel variant="raised" rail="teal">
          <SyntexPanelHeader>
            <div><Step number="1" /><SyntexPanelTitle>Contexto da apuração</SyntexPanelTitle><SyntexPanelDescription>Escolha o plano que autoriza a cobrança, a empresa e a competência.</SyntexPanelDescription></div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="grid gap-4 md:grid-cols-2">
            <Field label="Plano de arrecadação" className="md:col-span-2">
              <select value={planId} onChange={(e) => { setPlanId(e.target.value); setEstablishmentId(""); resetResult(); }} className={inputClass}>
                <option value="">Selecione um plano ativo…</option>
                {plans.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.value_type === "percentual" ? `${Number(item.value)}%` : formatMoeda(Number(item.value))}</option>)}
              </select>
            </Field>
            <Field label="Empresa">
              <select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setEstablishmentId(""); resetResult(); }} className={inputClass}>
                <option value="">Selecione a empresa…</option>
                {companies.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Competência">
              <input type="month" value={competence} onChange={(e) => { setCompetence(e.target.value); resetResult(); }} className={inputClass} />
            </Field>
            {requiresEstablishment ? (
              <Field label="Estabelecimento abrangido" hint="A CCT é resolvida no estabelecimento, não apenas na empresa." className="md:col-span-2">
                <select value={establishmentId} onChange={(e) => { setEstablishmentId(e.target.value); resetResult(); }} className={inputClass} disabled={!company}>
                  <option value="">Selecione matriz ou filial…</option>
                  {(company?.establishments ?? []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </Field>
            ) : null}
            {plan ? <div className="md:col-span-2"><SyntexAccentFrame tone="teal" className="rounded-control bg-teal-50/60 p-3 pl-4"><p className="text-body font-semibold text-ink">{plan.name}</p><p className="mt-1 text-label text-ink-2">{planContext.join(" · ")} · {AUDIENCE_LABEL[plan.audience]}</p></SyntexAccentFrame></div> : null}
          </SyntexPanelBody>
        </SyntexPanel>

        <SyntexPanel variant="standard" rail="blue">
          <SyntexPanelHeader>
            <div><Step number="2" /><SyntexPanelTitle>Base da competência</SyntexPanelTitle><SyntexPanelDescription>O Syntex solicita somente os dados previstos no método do plano.</SyntexPanelDescription></div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="grid gap-4 md:grid-cols-2">
            {!plan ? <p className="text-body text-ink-2 md:col-span-2">Selecione o plano para visualizar os dados necessários.</p> : null}
            {requiresHeadcount ? <Field label="Quantidade de funcionários"><input type="number" min="1" step="1" value={headcount} onChange={(e) => { setHeadcount(e.target.value); resetResult(); }} className={inputClass} /></Field> : null}
            {requiresHeadcount ? <Field label="Origem da quantidade"><select value={headcountSource} onChange={(e) => { setHeadcountSource(e.target.value); resetResult(); }} className={inputClass}><option value="finance_confirmed">Confirmado pelo financeiro</option><option value="company_registration">Informado no cadastro</option><option value="company_declared">Declarado pela empresa</option><option value="system_workers">Vínculos ativos no Syntex</option></select></Field> : null}
            {requiresFloor ? <Field label="Piso da categoria" hint="Valor vigente para esta competência."><MoneyInput value={categoryFloor} onChange={(value) => { setCategoryFloor(value); resetResult(); }} /></Field> : null}
            {requiresPayroll ? <Field label="Total da folha declarada" hint="Somente a base elegível para esta contribuição."><MoneyInput value={declaredPayroll} onChange={(value) => { setDeclaredPayroll(value); resetResult(); }} /></Field> : null}
            {plan?.calculation_method === "fixed_company" ? <div className="md:col-span-2"><SyntexAccentFrame tone="blue" className="rounded-control bg-blue-50/60 p-3 pl-4"><p className="text-body text-ink-2">Este plano utiliza valor fixo por empresa. Nenhuma base adicional é necessária.</p></SyntexAccentFrame></div> : null}
            <div className="flex items-center justify-between border-t border-border pt-4 md:col-span-2">
              <p className="text-label text-ink-3">Calcular não gera obrigação nem cobrança.</p>
              <button type="button" onClick={calculate} disabled={!readyForPreview || pending} className="h-input rounded-control border border-border-strong bg-surface px-4 text-body font-semibold text-ink hover:bg-surface-selected disabled:opacity-40">Revisar cálculo</button>
            </div>
          </SyntexPanelBody>
        </SyntexPanel>

        {error ? <p role="alert" className="rounded-control bg-red-50 px-4 py-3 text-body text-danger">{error}</p> : null}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24">
        <SyntexPanel variant={preview ? "dark" : "inset"} rail={preview ? "green" : "teal"}>
          <SyntexPanelHeader>
            <div><Step number="3" dark={Boolean(preview)} /><SyntexPanelTitle className={preview ? "text-white" : undefined}>Conferência</SyntexPanelTitle><SyntexPanelDescription className={preview ? "text-slate-300" : undefined}>Memória do valor antes da emissão.</SyntexPanelDescription></div>
          </SyntexPanelHeader>
          <SyntexPanelBody>
            {!preview ? <p className="text-body text-ink-2">Preencha a base e revise o cálculo. A cobrança só poderá ser emitida depois da confirmação.</p> : (
              <div className="space-y-4 text-slate-200">
                <div><p className="text-label uppercase tracking-wide text-slate-400">Fórmula aplicada</p><p className="mt-1 font-mono text-body text-white">{preview.formula}</p></div>
                {preview.unitAmount != null ? <div><p className="text-label uppercase tracking-wide text-slate-400">Valor por funcionário</p><p className="mt-1 text-component font-semibold text-white">{formatMoeda(preview.unitAmount)}</p></div> : null}
                <div className="border-t border-white/10 pt-4"><p className="text-label uppercase tracking-wide text-slate-400">Total da competência</p><p className="mt-1 text-3xl font-semibold tabular-nums text-white">{formatMoeda(preview.amount)}</p></div>
                <p className="text-label leading-relaxed text-slate-400">Ao confirmar, esta memória torna-se imutável e passa a explicar a obrigação financeira.</p>
              </div>
            )}
          </SyntexPanelBody>
        </SyntexPanel>

        {preview && !assessmentId && canWrite ? <button type="button" onClick={confirmAssessment} disabled={pending} className="inline-flex h-11 w-full items-center justify-center rounded-control bg-petrol-800 px-4 text-body font-semibold text-white hover:bg-petrol-700 disabled:opacity-50">{pending ? "Confirmando…" : "Confirmar apuração"}</button> : null}
        {preview && !canWrite ? <p className="rounded-control border border-amber-200 bg-amber-50 p-3 text-body text-amber-800">Você pode revisar o cálculo, mas finance.write é necessária para confirmar e emitir.</p> : null}
        {assessmentId ? <><div className="rounded-control border border-emerald-200 bg-emerald-50 p-3"><p className="text-body font-semibold text-emerald-800">Apuração confirmada</p><p className="mt-1 text-label text-emerald-700">Agora você pode emitir a cobrança com esta memória de cálculo.</p></div><button type="button" onClick={generateCharge} disabled={pending} className="inline-flex h-11 w-full items-center justify-center rounded-control bg-petrol-800 px-4 text-body font-semibold text-white hover:bg-petrol-700 disabled:opacity-50">{pending ? "Gerando…" : "Gerar cobrança"}</button></> : null}
      </aside>
    </div>
  );
}

function Step({ number, dark = false }: { number: string; dark?: boolean }) { return <span className={`mb-2 inline-flex size-6 items-center justify-center rounded-full text-label font-bold ${dark ? "bg-white/10 text-teal-300" : "bg-teal-50 text-petrol-700"}`}>{number}</span>; }
function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) { return <label className={`space-y-1.5 ${className}`}><span className="block text-label font-semibold text-ink-2">{label}</span>{children}{hint ? <span className="block text-label text-ink-3">{hint}</span> : null}</label>; }
function MoneyInput({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body text-ink-3">R$</span><input type="number" min="0.01" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} pl-10`} /></div>; }
const inputClass = "h-10 w-full rounded-control border border-border bg-surface px-3 text-body text-ink outline-none transition hover:border-border-strong focus:border-petrol-600 focus:ring-2 focus:ring-petrol-100 disabled:bg-surface-inset disabled:text-ink-3";
