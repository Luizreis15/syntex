/**
 * DEMO UI — substituir por dados reais depois
 * DEV-only: usado pelo Command Center Modo A. Não exibir rótulo “demo” na UI
 * do /painel (P1); a origem permanece documentada aqui e nos comentários
 * dos componentes consumidores.
 *
 * Números calibrados à ordem de grandeza do seed DEV (≈47 empresas, ≈680 filiados),
 * não à fantasia Lovable de 84k associados / R$ 3,5 mi/mês.
 */

export type DemoTone = "syntex" | "teal" | "ok" | "amber" | "critical";

export interface DemoArrecadacaoPoint {
  mes: string;
  /** Valores em R$ mil. */
  previsto: number;
  realizado: number;
}

export const DEMO_ARRECADACAO_SERIE: DemoArrecadacaoPoint[] = [
  { mes: "set/25", previsto: 128, realizado: 121 },
  { mes: "out/25", previsto: 131, realizado: 127 },
  { mes: "nov/25", previsto: 134, realizado: 130 },
  { mes: "dez/25", previsto: 148, realizado: 152 },
  { mes: "jan/26", previsto: 132, realizado: 124 },
  { mes: "fev/26", previsto: 135, realizado: 129 },
  { mes: "mar/26", previsto: 138, realizado: 136 },
  { mes: "abr/26", previsto: 140, realizado: 133 },
  { mes: "mai/26", previsto: 142, realizado: 141 },
  { mes: "jun/26", previsto: 145, realizado: 147 },
  { mes: "jul/26", previsto: 147, realizado: 143 },
  { mes: "ago/26", previsto: 152, realizado: 148 },
];

export const DEMO_ARRECADACAO_HERO = {
  label: "Arrecadação · ago/26",
  valueDisplay: "R$ 148",
  valueSuffix: "mil",
  delta: "+6,1%",
  metaLabel: "vs. jul/26 · 97% da meta",
  meter: 97,
  previsto12m: "R$ 1,67 mi",
  realizado12m: "R$ 1,63 mi",
  aderencia: "97,6%",
};

export const DEMO_OPERACAO_AGORA: {
  key: string;
  label: string;
  value: string;
  hint: string;
  tone: "info" | "warning" | "success" | "danger";
  href?: string;
}[] = [
  { key: "atendimentos", label: "Atendimentos hoje", value: "19", hint: "6 em fila", tone: "info" },
  {
    key: "homologacoes",
    label: "Homologações abertas",
    value: "7",
    hint: "2 no SLA limite",
    tone: "warning",
  },
  {
    key: "fiscalizacoes",
    label: "Fiscalizações em campo",
    value: "4",
    hint: "Mauá · SBC",
    tone: "success",
  },
  {
    key: "tarefas",
    label: "Tarefas pendentes",
    value: "31",
    hint: "9 atrasadas",
    tone: "success",
  },
  {
    key: "agenda",
    label: "Agendamentos em 2h",
    value: "12",
    hint: "3 confirmações",
    tone: "info",
  },
];

export const DEMO_MOVIMENTO_BASE: {
  label: string;
  value: string;
  delta: number;
  tone: DemoTone;
}[] = [
  { label: "Novas filiações", value: "+48", delta: 72, tone: "ok" },
  { label: "Desligamentos", value: "14", delta: 28, tone: "critical" },
  { label: "Novas empresas", value: "+3", delta: 55, tone: "syntex" },
  { label: "Cadastros incompletos", value: "11", delta: 41, tone: "amber" },
];

export const DEMO_ALERTAS: {
  title: string;
  meta: string;
  tone: "critical" | "amber";
  href?: string;
}[] = [
  {
    title: "5 cobranças retornaram erro",
    meta: "Remessa 2026-08-19 · Banco 033",
    tone: "critical",
    href: "/cobrancas",
  },
  {
    title: "4 homologações próximas do SLA",
    meta: "Vencem em menos de 6h",
    tone: "amber",
  },
  {
    title: "8 documentos aguardam validação",
    meta: "Jurídico · Mauá",
    tone: "amber",
  },
  {
    title: "9 empresas sem contato há +60 dias",
    meta: "Concentração em Mauá e Diadema",
    tone: "critical",
    href: "/empresas",
  },
];

export const DEMO_INTELLIGENCE = {
  tag: "Insight gerado há 4 min",
  insight: "A inadimplência das empresas de Mauá cresceu 14,2% nos últimos 60 dias.",
  detail:
    "Parte do valor em aberto está concentrada em empresas sem contato recente. O padrão coincide com disputa de representação e interrupção do desconto em folha.",
  actions: [
    { label: "Analisar empresas", href: "/empresas" },
    { label: "Ver cobranças", href: "/cobrancas" },
  ],
};

export const DEMO_ASSOCIADOS_DELTA = "+48 este mês";
export const DEMO_EMPRESAS_DELTA = "+3";
export const DEMO_STATUS = {
  operation: "Operação normal",
  alertsCount: 12,
  refreshedLabel: "há 2 min",
};
