/**
 * DEMO UI — substituir por dados reais depois
 *
 * Painéis do Trabalhador 360 sem fonte operacional (benefícios, agenda,
 * financeiro de mensalidade, dependentes, atendimentos).
 */

export const TRABALHADOR_360_TABS = [
  "Visão geral",
  "Associação",
  "Vínculos",
  "Financeiro",
  "Atendimentos",
  "Agenda",
  "Benefícios",
  "Jurídico",
  "Documentos",
  "Conversas",
  "Timeline",
] as const;

export type Trabalhador360Tab = (typeof TRABALHADOR_360_TABS)[number];

export const DEMO_TRAB_TIMELINE = [
  {
    when: "Hoje · 14:32",
    title: "Pagamento confirmado",
    detail: "R$ 84,90 · PIX",
    tone: "ok" as const,
  },
  {
    when: "Hoje · 11:10",
    title: "WhatsApp respondido",
    detail: "por equipe de atendimento",
    tone: "syntex" as const,
  },
  {
    when: "Ontem · 16:41",
    title: "Cadastro atualizado",
    detail: "Telefone alterado",
    tone: "teal" as const,
  },
  {
    when: "18 ago · 09:30",
    title: "Atendimento odontológico realizado",
    detail: "Clínica conveniada",
    tone: "ok" as const,
  },
  {
    when: "02 ago · 08:00",
    title: "Contribuição sindical processada",
    detail: "Competência 07/2026",
    tone: "syntex" as const,
  },
];

export const DEMO_TRAB_FINANCEIRO = [
  { label: "Adimplência 12m", value: "100%", pct: 100, tone: "ok" as const },
  { label: "Contribuições pagas", value: "12/12", pct: 100, tone: "syntex" as const },
  { label: "Uso de benefícios", value: "2 de 4", pct: 50, tone: "teal" as const },
];

export const DEMO_TRAB_BENEFICIOS = [
  { name: "Odontológico familiar", status: "Ativo", tone: "ok" as const },
  { name: "Convênio farmácia", status: "Ativo", tone: "ok" as const },
  { name: "Seguro de vida", status: "Disponível", tone: "syntex" as const },
  { name: "Clube de descontos", status: "Disponível", tone: "syntex" as const },
];

export const DEMO_TRAB_AGENDA = [
  { when: "22 ago · 14:30", title: "Odontologia", meta: "Clínica conveniada" },
  { when: "29 ago · 10:00", title: "Assembleia de categoria", meta: "Sede SECABC" },
];

export const DEMO_TRAB_ASSOCIACAO_STATS = [
  { label: "Assembleias", value: "9" },
  { label: "Atendimentos", value: "23" },
  { label: "Benefícios usados", value: "2" },
  { label: "Processos", value: "0" },
];

export const DEMO_TRAB_INTELLIGENCE = {
  tag: "Insight gerado há 12 min",
  insight: "Este associado é elegível a benefícios que ainda não utilizou.",
  detail:
    "Perfil semelhante a outros associados com alta adesão ao plano odontológico familiar. Contato nas próximas 72h tende a converter.",
  actions: [
    { label: "Registrar contato", href: "/trabalhadores" },
    { label: "Ver benefícios", href: "#beneficios" },
  ],
};

export const DEMO_TRAB_DEPENDENTES = { value: "2", hint: "cônjuge · filho · demo" };
export const DEMO_TRAB_BENEFICIOS_COUNT = { value: "4", hint: "disponíveis · demo" };
export const DEMO_TRAB_PROX_ATENDIMENTO = {
  value: "Amanhã 14:30",
  hint: "odontologia · demo",
};
export const DEMO_TRAB_MENSALIDADE = "R$ 84,90";
