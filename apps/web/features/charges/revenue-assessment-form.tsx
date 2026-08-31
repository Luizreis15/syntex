"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SyntexPanel, SyntexPanelBody, SyntexPanelDescription, SyntexPanelHeader, SyntexPanelTitle } from "@/components/ui/syntex-panel";
import { SyntexAccentFrame } from "@/components/ui/syntex-accent-rail";
import { SyntexField } from "@/components/ui/syntex-field";
import { formatMoeda } from "@/lib/formatters/moeda";
import {
  AUDIENCE_LABEL,
  CALCULATION_METHOD_LABEL,
  COLLECTION_ROLE_LABEL,
  REVENUE_PLAN_TYPE_LABEL,
  calculateContributionAssessment,
  competenceIsWithinPlan,
  competenceToDateSafe,
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
  const [planId, setPlanId] = useState("");
  const [companyId, setCompanyId] = useState(() =>
    companies.some((c) => c.id === initialCompanyId) ? initialCompanyId : "",
  );
  const [establishmentId, setEstablishmentId] = useState("");
  const [competence, setCompetence] = useState(() => {
    // Preferência demo: mês corrente em ISO; evita 1º dia futuro sem plano.
    return new Date().toISOString().slice(0, 7);
  });
  const [headcount, setHeadcount] = useState("");
  const [headcountSource, setHeadcountSource] = useState("finance_confirmed");
  const [categoryFloor, setCategoryFloor] = useState("");
  const [declaredPayroll, setDeclaredPayroll] = useState("");
  const [preview, setPreview] = useState<AssessmentCalculation | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const competenceDate = competenceToDateSafe(competence);
  const plansInForce = useMemo(
    () => plans.filter((p) => !competenceDate || competenceIsWithinPlan(p, competenceDate)),
    [plans, competenceDate],
  );

  // Preferir plano vigente (evita pré-selecionar legado fora da competência).
  useEffect(() => {
    setPlanId((current) => {
      if (current && plansInForce.some((p) => p.id === current)) return current;
      return (
        (initialPlanId && plansInForce.find((p) => p.id === initialPlanId)?.id) ||
        plansInForce[0]?.id ||
        ""
      );
    });
  }, [plansInForce, initialPlanId]);

  const plan = plans.find((item) => item.id === planId) ?? null;
  const company = companies.find((item) => item.id === companyId) ?? null;
  const planInForce = Boolean(plan && competenceDate && competenceIsWithinPlan(plan, competenceDate));
  const requiresEstablishment = plan?.source_type === "collective_agreement";
  const requiresHeadcount =
    plan?.calculation_method === "floor_headcount_percentage" ||
    plan?.calculation_method === "fixed_per_worker";
  const requiresFloor = plan?.calculation_method === "floor_headcount_percentage";
  const requiresPayroll = plan?.calculation_method === "declared_payroll_percentage";

  const readyForPreview = Boolean(
    plan &&
      planInForce &&
      company &&
      competence &&
      (!requiresEstablishment || establishmentId) &&
      (!requiresHeadcount || Number(headcount) > 0) &&
      (!requiresFloor || Number(categoryFloor) > 0) &&
      (!requiresPayroll || Number(declaredPayroll) > 0),
  );

  const planContext = useMemo(
    () =>
      plan
        ? [
            REVENUE_PLAN_TYPE_LABEL[plan.type],
            CALCULATION_METHOD_LABEL[plan.calculation_method],
            COLLECTION_ROLE_LABEL[plan.collection_role],
          ]
        : [],
    [plan],
  );

  function resetResult() {
    setPreview(null);
    setAssessmentId(null);
    setError(null);
  }

  function onCompetenceChange(next: string) {
    setCompetence(next);
    resetResult();
    const date = competenceToDateSafe(next);
    if (!date) return;
    setPlanId((current) => {
      const stillOk = plans.some((p) => p.id === current && competenceIsWithinPlan(p, date));
      if (stillOk) return current;
      return plans.find((p) => competenceIsWithinPlan(p, date))?.id ?? "";
    });
  }

  function calculate() {
    if (!plan) return;
    if (!planInForce) {
      setError("plano fora da vigência nesta competência");
      return;
    }
    setError(null);
    try {
      setPreview(
        calculateContributionAssessment(plan, {
          headcount: headcount ? Number(headcount) : null,
          categoryFloor: categoryFloor ? Number(categoryFloor) : null,
          declaredPayroll: declaredPayroll ? Number(declaredPayroll) : null,
        }),
      );
      setAssessmentId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "não foi possível calcular");
    }
  }

  async function confirmAssessment() {
    if (!preview || !plan) return;
    if (!planInForce) {
      setError("plano fora da vigência nesta competência");
      return;
    }
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
      if (response.status === 409) {
        setError(
          "Já existe apuração confirmada para esta empresa/plano/competência. Abra Cobranças para ver a cobrança gerada.",
        );
        return;
      }
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
    const chargeId = json.data?.chargeId as string | null | undefined;
    if (chargeId) {
      router.push(`/cobrancas/${chargeId}`);
    } else {
      router.push("/cobrancas");
    }
    router.refresh();
  }

  const planOptions = plansInForce.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.value_type === "percentual" ? `${Number(item.value)}%` : formatMoeda(Number(item.value))}`,
  }));

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <SyntexPanel variant="raised" rail="teal">
          <SyntexPanelHeader>
            <div>
              <Step number="1" />
              <SyntexPanelTitle>Contexto da apuração</SyntexPanelTitle>
              <SyntexPanelDescription>
                Escolha o plano que autoriza a cobrança, a empresa e a competência.
              </SyntexPanelDescription>
            </div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="grid gap-4 px-5 py-4 md:grid-cols-2">
            <SyntexField
              variant="select"
              label="Plano de arrecadação"
              name="planId"
              value={planId}
              onValueChange={(value) => {
                setPlanId(value);
                setEstablishmentId("");
                resetResult();
              }}
              options={
                planOptions.length > 0
                  ? planOptions
                  : [{ value: "", label: "Nenhum plano vigente nesta competência" }]
              }
              className="md:col-span-2"
            />
            <SyntexField
              variant="select"
              label="Empresa"
              name="companyId"
              value={companyId}
              onValueChange={(value) => {
                setCompanyId(value);
                setEstablishmentId("");
                resetResult();
              }}
              options={[
                { value: "", label: "Selecione a empresa…" },
                ...companies.map((item) => ({ value: item.id, label: item.label })),
              ]}
            />
            <SyntexField
              variant="input"
              label="Competência"
              name="competence"
              type="month"
              value={competence}
              onChange={(e) => onCompetenceChange(e.target.value)}
            />
            {requiresEstablishment ? (
              <SyntexField
                variant="select"
                label="Estabelecimento abrangido"
                name="establishmentId"
                hint="A CCT é resolvida no estabelecimento, não apenas na empresa."
                value={establishmentId}
                onValueChange={(value) => {
                  setEstablishmentId(value);
                  resetResult();
                }}
                options={[
                  { value: "", label: "Selecione matriz ou filial…" },
                  ...(company?.establishments ?? []).map((item) => ({
                    value: item.id,
                    label: item.label,
                  })),
                ]}
                className="md:col-span-2"
              />
            ) : null}
            {plan ? (
              <div className="md:col-span-2">
                <SyntexAccentFrame tone="teal" className="rounded-control bg-teal-50/60 p-3 pl-4">
                  <p className="text-body font-semibold text-ink">{plan.name}</p>
                  <p className="mt-1 text-label text-ink-2">
                    {planContext.join(" · ")} · {AUDIENCE_LABEL[plan.audience]}
                  </p>
                  <p className="mt-1 font-mono text-label text-ink-3">
                    Vigência: {plan.valid_from} → {plan.valid_until ?? "aberta"}
                  </p>
                </SyntexAccentFrame>
                {!planInForce ? (
                  <p role="alert" className="mt-2 text-body text-danger">
                    Este plano está fora da vigência na competência {competence}. Escolha outro plano
                    ou outra competência.
                  </p>
                ) : null}
              </div>
            ) : null}
            {plansInForce.length === 0 ? (
              <p role="alert" className="text-body text-danger md:col-span-2">
                Não há plano ativo vigente em {competence}. Cadastre um plano em Cobranças → Planos
                ou ajuste a competência.
              </p>
            ) : null}
          </SyntexPanelBody>
        </SyntexPanel>

        <SyntexPanel variant="standard" rail="blue">
          <SyntexPanelHeader>
            <div>
              <Step number="2" />
              <SyntexPanelTitle>Base da competência</SyntexPanelTitle>
              <SyntexPanelDescription>
                O Syntex solicita somente os dados previstos no método do plano.
              </SyntexPanelDescription>
            </div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="grid gap-4 px-5 py-4 md:grid-cols-2">
            {!plan ? (
              <p className="text-body text-ink-2 md:col-span-2">
                Selecione o plano para visualizar os dados necessários.
              </p>
            ) : null}
            {requiresHeadcount ? (
              <SyntexField
                variant="input"
                label="Quantidade de funcionários"
                name="headcount"
                type="number"
                min={1}
                step={1}
                value={headcount}
                onChange={(e) => {
                  setHeadcount(e.target.value);
                  resetResult();
                }}
              />
            ) : null}
            {requiresHeadcount ? (
              <SyntexField
                variant="select"
                label="Origem da quantidade"
                name="headcountSource"
                value={headcountSource}
                onValueChange={(value) => {
                  setHeadcountSource(value);
                  resetResult();
                }}
                options={[
                  { value: "finance_confirmed", label: "Confirmado pelo financeiro" },
                  { value: "company_registration", label: "Informado no cadastro" },
                  { value: "company_declared", label: "Declarado pela empresa" },
                  { value: "system_workers", label: "Vínculos ativos no Syntex" },
                ]}
              />
            ) : null}
            {requiresFloor ? (
              <SyntexField
                variant="input"
                label="Piso da categoria"
                name="categoryFloor"
                hint="Valor vigente para esta competência."
                type="number"
                min={0.01}
                step={0.01}
                value={categoryFloor}
                onChange={(e) => {
                  setCategoryFloor(e.target.value);
                  resetResult();
                }}
              />
            ) : null}
            {requiresPayroll ? (
              <SyntexField
                variant="input"
                label="Total da folha declarada (R$)"
                name="declaredPayroll"
                hint="Somente a base elegível para esta contribuição."
                type="number"
                min={0.01}
                step={0.01}
                value={declaredPayroll}
                onChange={(e) => {
                  setDeclaredPayroll(e.target.value);
                  resetResult();
                }}
              />
            ) : null}
            {plan?.calculation_method === "fixed_company" ? (
              <div className="md:col-span-2">
                <SyntexAccentFrame tone="blue" className="rounded-control bg-blue-50/60 p-3 pl-4">
                  <p className="text-body text-ink-2">
                    Este plano utiliza valor fixo por empresa. Nenhuma base adicional é necessária.
                  </p>
                </SyntexAccentFrame>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 md:col-span-2">
              <p className="text-label text-ink-3">Calcular não gera obrigação nem cobrança.</p>
              <button
                type="button"
                onClick={calculate}
                disabled={!readyForPreview || pending}
                className="h-input rounded-control border border-border-strong bg-surface px-4 text-body font-semibold text-ink hover:bg-surface-selected disabled:opacity-40"
              >
                Revisar cálculo
              </button>
            </div>
          </SyntexPanelBody>
        </SyntexPanel>

        {error ? (
          <p role="alert" className="rounded-control bg-red-50 px-4 py-3 text-body text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24">
        <SyntexPanel variant={preview ? "dark" : "inset"} rail={preview ? "green" : "teal"}>
          <SyntexPanelHeader>
            <div>
              <Step number="3" dark={Boolean(preview)} />
              <SyntexPanelTitle className={preview ? "text-white" : undefined}>Conferência</SyntexPanelTitle>
              <SyntexPanelDescription className={preview ? "text-slate-300" : undefined}>
                Memória do valor antes da emissão.
              </SyntexPanelDescription>
            </div>
          </SyntexPanelHeader>
          <SyntexPanelBody className="px-5 py-4">
            {!preview ? (
              <p className="text-body text-ink-2">
                Preencha a base e revise o cálculo. A cobrança só poderá ser emitida depois da
                confirmação.
              </p>
            ) : (
              <div className="space-y-4 text-slate-200">
                <div>
                  <p className="text-label uppercase tracking-wide text-slate-400">Fórmula aplicada</p>
                  <p className="mt-1 font-mono text-body text-white">{preview.formula}</p>
                </div>
                {preview.unitAmount != null ? (
                  <div>
                    <p className="text-label uppercase tracking-wide text-slate-400">
                      Valor por funcionário
                    </p>
                    <p className="mt-1 text-component font-semibold text-white">
                      {formatMoeda(preview.unitAmount)}
                    </p>
                  </div>
                ) : null}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-label uppercase tracking-wide text-slate-400">
                    Total da competência
                  </p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-white">
                    {formatMoeda(preview.amount)}
                  </p>
                </div>
                {assessmentId ? (
                  <p className="rounded-control bg-emerald-500/20 px-3 py-2 text-label font-semibold text-emerald-200">
                    Apuração confirmada — próxima etapa: gerar cobrança.
                  </p>
                ) : (
                  <p className="text-label leading-relaxed text-slate-400">
                    Ao confirmar, esta memória torna-se imutável e passa a explicar a obrigação
                    financeira.
                  </p>
                )}
              </div>
            )}
          </SyntexPanelBody>
        </SyntexPanel>

        {/* CTAs claros no fundo do papel — nunca petrol sobre painel dark */}
        {preview && !assessmentId && canWrite ? (
          <button
            type="button"
            onClick={confirmAssessment}
            disabled={pending || !planInForce}
            className="inline-flex h-11 w-full items-center justify-center rounded-control border-2 border-petrol-800 bg-white px-4 text-body font-semibold text-petrol-900 shadow-sm hover:bg-teal-50 disabled:opacity-50"
          >
            {pending ? "Confirmando…" : "Confirmar apuração"}
          </button>
        ) : null}
        {preview && !canWrite ? (
          <p className="rounded-control border border-amber-200 bg-amber-50 p-3 text-body text-amber-800">
            Você pode revisar o cálculo, mas finance.write é necessária para confirmar e emitir.
          </p>
        ) : null}
        {assessmentId ? (
          <>
            <div className="rounded-control border border-emerald-300 bg-emerald-50 p-4">
              <p className="text-body font-semibold text-emerald-900">Apuração confirmada</p>
              <p className="mt-1 text-label text-emerald-800">
                Memória de cálculo gravada. Clique abaixo para emitir a cobrança desta competência.
              </p>
            </div>
            <button
              type="button"
              onClick={generateCharge}
              disabled={pending}
              className="inline-flex h-11 w-full items-center justify-center rounded-control bg-teal-500 px-4 text-body font-semibold text-petrol-950 shadow-sm hover:bg-teal-400 disabled:opacity-50"
            >
              {pending ? "Gerando…" : "Gerar cobrança"}
            </button>
            <a
              href="/cobrancas"
              className="inline-flex h-11 w-full items-center justify-center rounded-control border-2 border-petrol-800 bg-white px-4 text-body font-semibold text-petrol-900 hover:bg-teal-50"
            >
              Ir para lista de cobranças
            </a>
          </>
        ) : null}
      </aside>
    </div>
  );
}

function Step({ number, dark = false }: { number: string; dark?: boolean }) {
  return (
    <span
      className={`mb-2 inline-flex size-6 items-center justify-center rounded-full text-label font-bold ${
        dark ? "bg-white/10 text-teal-300" : "bg-teal-50 text-petrol-700"
      }`}
    >
      {number}
    </span>
  );
}
