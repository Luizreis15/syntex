/**
 * DEMO UI — substituir por dados reais depois
 *
 * Painéis da Empresa 360 sem fonte operacional no Syntex
 * (homologações, contato, claim split, timeline de atividade, arrecadação mensal).
 */

export type EmpresaDemoTone = "syntex" | "teal" | "ok" | "amber" | "critical" | "neutral";

export const EMPRESA_360_TABS = [
  "Visão geral",
  "Representação",
  "Trabalhadores",
  "Arrecadação",
  "Homologações",
  "Fiscalização",
  "Documentos",
  "Conversas",
  "Timeline",
] as const;

export type Empresa360Tab = (typeof EMPRESA_360_TABS)[number];

export const DEMO_EMPRESA_ARRECADACAO = [
  { mes: "set/25", previsto: 16.2, realizado: 15.1 },
  { mes: "out/25", previsto: 16.5, realizado: 15.8 },
  { mes: "nov/25", previsto: 16.8, realizado: 16.2 },
  { mes: "dez/25", previsto: 18.4, realizado: 19.1 },
  { mes: "jan/26", previsto: 16.4, realizado: 15.2 },
  { mes: "fev/26", previsto: 16.9, realizado: 16.1 },
  { mes: "mar/26", previsto: 17.2, realizado: 17.0 },
  { mes: "abr/26", previsto: 17.5, realizado: 16.4 },
  { mes: "mai/26", previsto: 17.8, realizado: 17.6 },
  { mes: "jun/26", previsto: 18.0, realizado: 18.3 },
  { mes: "jul/26", previsto: 18.2, realizado: 17.5 },
  { mes: "ago/26", previsto: 18.8, realizado: 18.4 },
];

export const DEMO_EMPRESA_HOMOLOGACOES = {
  value: "3 abertas",
  hint: "1 no SLA limite",
};

export const DEMO_EMPRESA_CONTATO = {
  value: "5 dias",
  hint: "WhatsApp · equipe",
};

export const DEMO_EMPRESA_PENDENCIAS_EXTRA = [
  { title: "Documento de CCT ausente", meta: "Jurídico", tone: "amber" as const },
  { title: "Homologação sem confirmação", meta: "24/08 10:00", tone: "syntex" as const },
];

export const DEMO_EMPRESA_CLAIM = [
  {
    name: "Sind. dos Comerciários do ABC",
    sigla: "AB",
    share: 62,
    note: "Base histórica",
    tone: "syntex" as const,
  },
  {
    name: "Sind. Comerciários São Bernardo",
    sigla: "SB",
    share: 38,
    note: "Reivindicação de 2026 · CNAE conexo",
    tone: "amber" as const,
  },
];

export const DEMO_EMPRESA_TIMELINE = [
  {
    when: "Hoje · 15:04",
    title: "Notificação de débito enviada",
    detail: "E-mail · financeiro",
    tone: "amber" as const,
  },
  {
    when: "Hoje · 09:12",
    title: "Homologação agendada",
    detail: "Unidade · 24/08 10:00",
    tone: "syntex" as const,
  },
  {
    when: "Ontem · 17:38",
    title: "Contestação de representação protocolada",
    detail: "Sindicato Comerciários SBC",
    tone: "critical" as const,
  },
  {
    when: "18 ago · 11:20",
    title: "Fiscalização concluída",
    detail: "Estabelecimento · sem apontamentos",
    tone: "ok" as const,
  },
];

export const DEMO_EMPRESA_INTELLIGENCE = {
  tag: "Insight gerado há 4 min",
  insight: "A empresa possui trabalhadores potencialmente não vinculados à base atual.",
  detail:
    "Cruzamento de folha e homologações indica divergência de vínculo em estabelecimentos — impacto estimado em contribuições mensais.",
  actions: [
    { label: "Revisar trabalhadores", href: "/trabalhadores" },
    { label: "Ver cobranças", href: "/cobrancas" },
  ],
};

/** Proporções DEMO quando só há total de vínculos. */
export function demoWorkerBreakdown(total: number) {
  if (total <= 0) {
    return [
      { label: "Associados", value: 0, pct: 0, tone: "ok" as const },
      { label: "Não associados", value: 0, pct: 0, tone: "syntex" as const },
      { label: "Cadastro incompleto", value: 0, pct: 0, tone: "amber" as const },
    ];
  }
  const associados = Math.round(total * 0.69);
  const incompleto = Math.max(1, Math.round(total * 0.05));
  const nao = Math.max(0, total - associados - incompleto);
  return [
    { label: "Associados", value: associados, pct: Math.round((associados / total) * 100), tone: "ok" as const },
    { label: "Não associados", value: nao, pct: Math.round((nao / total) * 100), tone: "syntex" as const },
    {
      label: "Cadastro incompleto",
      value: incompleto,
      pct: Math.round((incompleto / total) * 100),
      tone: "amber" as const,
    },
  ];
}
