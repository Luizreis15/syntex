# SYNTEX FRONT-END SYSTEM

## Product Design + Front-End Architecture Specification — v1.0

**Produto:** Syntex — Soluções Sindicais
**Categoria:** SaaS B2B vertical / Sindicato Operating System
**Objetivo:** estabelecer a linguagem visual, arquitetura de interface e padrões técnicos que regerão todo o front-end do Syntex.

---

# 1. OBJETIVO DESTA ESPECIFICAÇÃO

O Syntex não deve parecer:

* um ERP legado modernizado;
* um template administrativo;
* um projeto gerado por Lovable/Bolt;
* um dashboard genérico de SaaS;
* uma interface editorial;
* um sistema excessivamente arredondado;
* um produto “fofinho”;
* um software white-label barato.

O Syntex deve transmitir:

> **infraestrutura crítica para gestão sindical.**

A percepção desejada é:

**robustez + autoridade + inteligência + precisão + escala + tecnologia.**

A experiência deverá estar mais próxima conceitualmente de produtos B2B premium e plataformas operacionais do que de ERPs tradicionais.

---

# 2. PERSONALIDADE VISUAL

## 2.1 Atributos principais

O Syntex é:

* sólido;
* preciso;
* tecnológico;
* institucional;
* estratégico;
* confiável;
* sofisticado;
* rápido;
* organizado;
* poderoso.

---

## 2.2 Antiatributos

O Syntex NÃO é:

* delicado;
* artesanal;
* romântico;
* lifestyle;
* excessivamente minimalista;
* infantil;
* informal;
* extravagante;
* decorativo;
* futurista caricato.

---

# 3. DIREÇÃO VISUAL

Nome interno da direção:

# Institutional Tech

ou:

# Operational Authority

A interface deverá combinar:

```text
SOLIDEZ INSTITUCIONAL
        +
SOFTWARE B2B PREMIUM
        +
DENSIDADE OPERACIONAL
        +
INTELIGÊNCIA DE DADOS
```

---

# 4. PRINCÍPIO CENTRAL DE UX

O Syntex não será organizado mentalmente por:

> telas e formulários.

Será organizado por:

> entidades, contexto, ações e workflows.

Modelo tradicional:

```text
MENU
↓
MÓDULO
↓
SUBMENU
↓
TELA
↓
FORMULÁRIO
```

Modelo Syntex:

```text
CONTEXTO
↓
ENTIDADE
↓
SITUAÇÃO
↓
AÇÃO
↓
WORKFLOW
```

---

# 5. PALETA PRINCIPAL

Eliminar completamente o nude quente apresentado no primeiro conceito.

A base deve ser **fria e neutra**.

---

## 5.1 Graphite

### Graphite 950

`#0B0F14`

Uso:

* sidebar;
* áreas críticas;
* command palette;
* superfícies dark.

### Graphite 900

`#11161D`

### Graphite 800

`#1C232C`

### Graphite 700

`#2B3440`

---

# 6. SUPERFÍCIES

## Background principal

`#F5F7F9`

Frio.

Não bege.

Não creme.

Não nude.

---

## Surface

`#FFFFFF`

Cards, drawers, tabelas e painéis.

---

## Surface Secondary

`#EEF1F4`

---

## Border

`#DCE1E7`

---

## Border Strong

`#C7CED7`

---

# 7. COR INSTITUCIONAL SYNTEX

Minha direção principal:

# Deep Cobalt

### Syntex 900

`#102A43`

### Syntex 800

`#123B5D`

### Syntex 700

`#15527A`

### Syntex 600

`#176A9A`

### Syntex 500

`#1687C0`

### Syntex 400

`#3EA7D8`

Não utilizar azul excessivamente vibrante em grandes superfícies.

O azul atua como:

* ação;
* navegação;
* seleção;
* inteligência;
* vínculo;
* confiança.

---

# 8. ACCENT COLOR

Para situações de destaque:

### Signal Amber

`#D99A23`

Utilização restrita:

* atenção;
* ações importantes;
* métricas especiais;
* indicadores.

Nunca como cor dominante.

---

# 9. CORES SEMÂNTICAS

## Success

`#18865C`

## Warning

`#C98512`

## Danger

`#C43D32`

## Critical

`#9F2424`

## Information

`#2573B8`

## Neutral

`#697586`

---

# 10. REPRESENTAÇÃO DE STATUS

Status nunca devem depender apenas da cor.

Exemplo:

```text
● Regular
▲ Atenção
● Em análise
! Inadimplente
× Cancelado
```

Combinar:

* texto;
* ícone;
* cor;
* contraste.

---

# 11. TIPOGRAFIA

Eliminar serif como tipografia funcional principal.

## Família recomendada

### Geist Sans

ou:

### Inter

Minha preferência para Syntex:

# Geist

Por transmitir tecnologia sem parecer startup genérica.

---

# 12. TIPOGRAFIA MONO

### Geist Mono

Utilizar para:

* CNPJ;
* CPF;
* códigos;
* competência;
* IDs;
* valores técnicos;
* números bancários;
* datas em determinados contextos.

Exemplo:

```text
CNPJ 98.765.432/0001-15
```

---

# 13. ESCALA TIPOGRÁFICA

## Display

32–36px

Uso extremamente limitado.

---

## Page Title

26–30px
600/650

---

## Section Title

18–20px
600

---

## Component Title

15–16px
600

---

## Body

14px

---

## Dense Body

13px

---

## Label

12px
500

---

## Meta

11px
500
letter-spacing controlado.

---

# 14. REGRA DE TÍTULOS

Não utilizar títulos gigantes.

Exemplo errado:

```text
SUPERMERCADOS
BANDEIRANTES S.A.
```

ocupando 20% da tela.

Preferido:

```text
Supermercados Bandeirantes S.A.     [Representação disputada]
```

A tela é ferramenta operacional.

Não capa editorial.

---

# 15. RAIO DE BORDA

Evitar a linguagem:

> SaaS + cards fofinhos.

Tokens:

```text
radius-xs: 3px
radius-sm: 5px
radius-md: 7px
radius-lg: 10px
```

Não usar:

```text
16px
20px
24px
```

em todos os componentes.

---

# 16. SOMBRAS

Sombras quase inexistentes.

Hierarquia prioritariamente por:

* borda;
* superfície;
* espaçamento;
* elevação contextual.

Exemplo:

```text
shadow-sm:
0 1px 2px rgba(0,0,0,.05)
```

Drawers e overlays podem receber elevação maior.

---

# 17. GRID

Desktop base:

```text
12-column grid
```

Container:

```text
max-width: none
```

Syntex é sistema operacional.

Deve utilizar área disponível.

Não utilizar layout centralizado estilo website.

---

# 18. SIDEBAR

Desktop:

```text
240–260px
```

Modo compacto:

```text
64–72px
```

Cor:

```text
Graphite 950
```

---

# 19. ESTRUTURA DA SIDEBAR

```text
SYNTEX

VISÃO GERAL
Overview

RELAÇÕES
Trabalhadores
Empresas
Representação

OPERAÇÃO
Atendimento
Agenda
Homologações
Fiscalização
Jurídico

FINANCEIRO
Arrecadação
Cobrança
Financeiro

ENGAJAMENTO
Comunicação
Campanhas
Benefícios

INTELIGÊNCIA
Analytics
Syntex Intelligence

ADMINISTRAÇÃO
Equipe
Configurações
```

Não mostrar módulos para os quais o usuário não possui acesso.

---

# 20. TENANT SWITCHER

Topo da sidebar:

```text
SECABC
Sindicato dos Comerciários do ABC
⌄
```

Permitir futura troca de tenant apenas para usuários autorizados Veramo/multiorganização.

---

# 21. BRANCH SWITCHER

Separado do tenant:

```text
Unidade
Todas as unidades ⌄
```

ou:

```text
Santo André
```

O usuário precisa saber sempre qual escopo está visualizando.

---

# 22. TOPBAR

Altura:

```text
56–60px
```

Elementos:

```text
Breadcrumb
Busca Global
Quick Create
Notificações
Ajuda
Perfil
```

---

# 23. BUSCA GLOBAL

Um dos componentes mais importantes do Syntex.

Atalho:

```text
⌘ K
```

Placeholder:

```text
Buscar trabalhador, empresa, CPF, CNPJ, protocolo...
```

---

# 24. COMMAND PALETTE

Resultado:

```text
TRABALHADORES

João Carlos da Silva
CPF ***.***.***-21
Supermercado XPTO

EMPRESAS

Supermercado XPTO Ltda.
CNPJ 12.345.678/0001-90

AÇÕES

+ Novo atendimento
+ Nova empresa
+ Nova associação
```

Respeitando integralmente permissions/scopes.

---

# 25. QUICK CREATE

Botão global:

```text
+ Criar
```

Menu contextual:

```text
Trabalhador
Empresa
Atendimento
Agendamento
Cobrança
Homologação
Tarefa
```

Itens exibidos segundo autorização.

---

# 26. PAGE HEADER

Todo workspace deverá utilizar anatomia semelhante.

```text
Breadcrumb

Título da entidade              STATUS

metadata principal

ações contextuais
```

Exemplo:

```text
Empresas / Supermercados Bandeirantes

Supermercados Bandeirantes S.A.       [Representação disputada]

CNPJ 98.765.432/0001-15
Mauá/SP
CNAE 47.11-3-02

[Editar] [Nova tarefa] [Mais ⋯]
```

---

# 27. WORKSPACE 360

Padrão central do produto.

Entidades principais devem possuir:

```text
HEADER
↓
SUMMARY BAR
↓
CONTEXT NAVIGATION
↓
CONTENT
↓
TIMELINE / ACTIVITY
```

---

# 28. SUMMARY BAR

Exemplo Empresa:

```text
TRABALHADORES
312

ARRECADAÇÃO
R$ 18.420/mês

PENDÊNCIAS
R$ 4.830

HOMOLOGAÇÕES
3 abertas

ÚLTIMO CONTATO
5 dias
```

Cards compactos.

Não criar cinco “cartões gigantes”.

---

# 29. NAVIGATION TABS

Exemplo Empresa:

```text
Visão geral
Representação
Trabalhadores
Arrecadação
Homologações
Fiscalização
Documentos
Conversas
Timeline
```

Tabs horizontalmente roláveis quando necessário.

---

# 30. SIDEPANEL CONTEXTUAL

Utilizar side panel/drawer para ações rápidas.

Exemplo:

clicar em trabalhador dentro da empresa:

```text
┌────────────────────────────┐
│ João Carlos Silva          │
│                            │
│ Associado ativo            │
│ Operador de caixa          │
│                            │
│ Último pagamento ✓         │
│ Último atendimento 12 dias │
│                            │
│ [Abrir perfil completo]    │
└────────────────────────────┘
```

Evita perder contexto.

---

# 31. DATA TABLE — COMPONENTE CORE

O Syntex viverá muito sobre dados.

A DataTable precisa ser de primeira classe.

Recursos:

* sorting;
* filtering;
* column visibility;
* resizing;
* pinning;
* pagination;
* row selection;
* bulk actions;
* saved views;
* export controlado;
* server-side filtering.

Base:

```text
TanStack Table
```

---

# 32. TOOLBAR DE TABELA

Exemplo:

```text
[Buscar] [Status ▼] [Unidade ▼] [Mais filtros]

247 empresas

                      [Colunas] [Salvar visão]
```

---

# 33. SAVED VIEWS

Usuário poderá criar:

```text
Minha carteira
Empresas inadimplentes
Mauá
Sem contato > 60 dias
Fiscalização pendente
```

Cada view armazena:

* filtros;
* ordenação;
* colunas;
* agrupamentos.

---

# 34. BULK ACTIONS

Selecionando linhas:

```text
12 selecionadas

[Enviar comunicação]
[Criar tarefa]
[Exportar]
[Mais]
```

Permissão separada para bulk operation.

---

# 35. FILTROS

Não abrir 15 selects simultaneamente.

Ter:

```text
filtros principais
+
More Filters
```

More Filters abre sidepanel.

---

# 36. STATUS BADGES

Exemplo:

```text
REGULAR
```

Pequeno.

Sem pills gigantes.

Radius:

```text
4–6px
```

---

# 37. CARDS

Cards deverão existir somente quando houver agrupamento semântico real.

Nunca transformar cada dado em card.

Erro típico:

```text
card
card
card
card
card
card
```

Resultado:

Lovable Dashboard Syndrome.

---

# 38. MÉTRICAS

Métrica:

```text
ARRECADAÇÃO DO MÊS

R$ 3,48 mi
↑ 8,2%

vs. mês anterior
```

Evitar:

* gradientes;
* ícones gigantes;
* gráficos decorativos.

---

# 39. GRÁFICOS

Gráficos precisam responder perguntas.

Não decorar dashboard.

Exemplo:

```text
ARRECADAÇÃO
últimos 12 meses
```

Com:

* tooltip;
* comparação;
* filtros;
* drilldown.

---

# 40. TIMELINE

Componente estratégico.

Exemplo:

```text
HOJE

14:32
Pagamento confirmado
R$ 84,90
via PIX

11:10
WhatsApp respondido
por Mariana Lopes

ONTEM

16:41
Cadastro atualizado
Telefone alterado
```

Eventos agrupados por dia.

---

# 41. ACTIVITY EVENT

Objeto visual padrão:

```text
timestamp
actor
action
entity
metadata
source
```

A timeline deve integrar múltiplos domínios.

---

# 42. NOTIFICATION CENTER

Painel:

```text
Hoje

3 homologações próximas do SLA

12 cobranças retornaram erro

4 documentos aguardando validação

2 integrações degradadas
```

Não apenas notificações sociais.

São notificações operacionais.

---

# 43. ALERT SYSTEM

Quatro níveis:

```text
Info
Success
Warning
Critical
```

Critical deve chamar atenção de verdade.

---

# 44. FORMULÁRIOS

Evitar páginas com 70 campos simultâneos.

Utilizar:

* sections;
* progressive disclosure;
* step forms quando necessário;
* contextual validation;
* autosave quando seguro.

---

# 45. FORM SECTION

Exemplo:

```text
DADOS DA EMPRESA
─────────────────

Razão social
[                       ]

Nome fantasia
[                       ]

CNPJ
[                       ]
```

Não utilizar caixas coloridas para cada seção.

---

# 46. FIELD DENSITY

Inputs:

```text
36–40px
```

Não 48–56px.

B2B precisa de densidade.

---

# 47. DETAIL PANEL

Dados somente leitura não devem parecer formulário desabilitado.

Errado:

```text
[ Supermercado XPTO ]
[ 12.345.678...    ]
```

Preferido:

```text
Razão Social
Supermercado XPTO Ltda.

CNPJ
12.345.678/0001-90
```

---

# 48. RESPONSIVIDADE

Três contextos.

### Desktop

Experiência principal.

### Tablet

Operação móvel/interna.

### Mobile

Consultas e atividades específicas.

Não tentar reproduzir todas as funções desktop em 375px.

---

# 49. PWA

A arquitetura deverá permitir PWA futura para:

* fiscalização;
* consultas;
* agendamentos;
* notificações;
* carteirinha;
* QR Code.

---

# 50. DENSITY MODES

Preparar:

```text
Comfortable
Compact
```

Compact especialmente útil para:

* financeiro;
* empresas;
* arrecadação.

---

# 51. MOTION

Muito discreto.

Transitions:

```text
120–180ms
```

Usar animação para:

* continuidade;
* abertura de drawer;
* mudança de estado.

Nunca para decoração.

---

# 52. ÍCONES

Recomendado:

```text
Lucide
```

Padrão:

```text
16px
18px
20px
```

Não colocar ícones em tudo.

---

# 53. DARK MODE

Não considero prioridade para MVP.

A sidebar será dark.

O conteúdo principal deverá nascer light.

Dark mode poderá ser introduzido posteriormente.

---

# 54. WHITE LABEL

Tenant poderá personalizar:

```text
logo
nome
favicon
accent secundário
portal externo
```

Mas NÃO deverá alterar livremente:

* cores semânticas;
* contraste;
* componentes;
* layouts;
* tipografia.

White label não pode destruir UX.

---

# 55. ACESSIBILIDADE

Baseline:

```text
WCAG 2.2 AA
```

Implementar desde a fundação:

* keyboard navigation;
* focus states;
* contrast;
* aria labels;
* screen reader support;
* error announcements.

---

# 56. FRONT-END STACK

```text
Next.js
React
TypeScript

Tailwind CSS

Radix primitives
shadcn/ui

TanStack Query
TanStack Table

React Hook Form
Zod

Lucide

Recharts / ECharts
```

Para visualizações mais complexas, considerar ECharts.

---

# 57. SHADCN/UI

Pode ser usado como **primitive/component foundation**.

Não como design system pronto.

Isso é fundamental.

Errado:

```text
npx shadcn add...
↓
usar default
```

Correto:

```text
Radix/shadcn primitive
↓
Syntex tokens
↓
Syntex variants
↓
Syntex interactions
↓
Syntex component
```

---

# 58. ORGANIZAÇÃO DO FRONT-END

Sugestão:

```text
/apps/web

/features
   /companies
   /people
   /membership
   /finance
   /scheduling
   /homologation
   /legal
   /inspection
   /communications

/components
   /ui
   /layout
   /data-display
   /feedback

/lib
   /auth
   /permissions
   /api
   /formatters
   /validation

/hooks

/types
```

---

# 59. FEATURE OWNERSHIP

Cada domínio deve possuir seus componentes específicos.

Exemplo:

```text
/features/companies

components/
queries/
actions/
schemas/
types/
permissions/
```

Evitar pasta global com:

```text
components/
    CompanySomething.tsx
    WorkerSomething.tsx
    FinanceWhatever.tsx
```

---

# 60. SERVER COMPONENTS

Next.js Server Components por padrão.

Client Components apenas quando necessários.

Exemplo:

Server:

* page shell;
* leitura de dados;
* permission boundary;
* initial queries.

Client:

* DataTable;
* filters;
* drag;
* interactive forms;
* command palette.

---

# 61. STATE MANAGEMENT

Não introduzir Redux global preventivamente.

Usar:

```text
Server State
→ TanStack Query

URL State
→ searchParams

Local UI State
→ React

Form State
→ React Hook Form
```

Adicionar store global apenas para necessidade concreta.

---

# 62. URL COMO ESTADO

Filtros relevantes deverão refletir URL.

Exemplo:

```text
/companies?
branch=maua
&status=active
&debt=overdue
```

Permite:

* compartilhar;
* voltar;
* bookmark;
* saved view.

---

# 63. PERMISSION BOUNDARIES

Nunca:

```text
if (role === 'admin')
```

No componente.

Preferir:

```text
<Can permission="finance.charge.cancel">
```

Mas UI não é fonte de segurança.

A API/database continua responsável pela autorização efetiva.

---

# 64. FEATURE FLAGS

Componentes devem suportar:

```text
tenant flag
user flag
module flag
rollout
```

---

# 65. ERROR BOUNDARIES

Cada domínio importante deverá possuir boundaries adequados.

Erro de gráfico não pode derrubar todo dashboard.

---

# 66. LOADING STATES

Nunca spinner central como padrão.

Utilizar skeleton estrutural.

---

# 67. EMPTY STATES

Exemplo:

```text
Nenhuma homologação aberta

As homologações solicitadas para esta empresa
aparecerão aqui.

[Nova homologação]
```

Contextual.

Não usar ilustrações fofas.

---

# 68. SUCCESS FEEDBACK

Evitar modal:

> “Sucesso!”

Preferir toast:

```text
Pagamento registrado.
```

Se houver próxima ação:

```text
Pagamento confirmado.

[Emitir recibo]
```

---

# 69. PAGE ANATOMY — DASHBOARD

# Syntex Overview

```text
┌──────────────────────────────────────────────┐
│ Bom dia, Mariana              18 ago 2026    │
│ Operação SECABC · Todas unidades            │
├──────────────────────────────────────────────┤
│ ASSOCIADOS | ARRECADAÇÃO | EMPRESAS | SLA   │
├──────────────────────────────────────────────┤
│                                              │
│ Arrecadação          Pendências importantes │
│ gráfico                                      │
│                                              │
├──────────────────────────────────────────────┤
│ Operação de hoje                             │
│                                              │
│ 19 atendimentos                              │
│ 7 homologações                               │
│ 4 fiscalizações                              │
│ 31 tarefas                                   │
├──────────────────────────────────────────────┤
│ Syntex Intelligence                          │
│                                              │
│ "Inadimplência aumentou 8,4% em Mauá..."     │
└──────────────────────────────────────────────┘
```

---

# 70. DASHBOARD NÃO É IGUAL PARA TODOS

Atendimento verá:

```text
agenda
tarefas
atendimentos
cadastros pendentes
```

Financeiro verá:

```text
arrecadação
conciliação
inadimplência
cobranças
```

Diretoria verá:

```text
indicadores executivos
comparações
unidades
tendências
```

Dashboard é role-aware.

---

# 71. PAGE ANATOMY — TRABALHADOR 360

```text
João Carlos da Silva                 ASSOCIADO ATIVO

CPF ***.***.***-21
Supermercado XPTO · Operador de caixa
Santo André

[Atendimento] [Agendar] [Mais]

──────────────────────────────────────

Associação     Financeiro     Benefícios
Ativa          Regular        4 disponíveis

──────────────────────────────────────

Visão geral | Associação | Trabalho |
Financeiro | Agenda | Jurídico |
Documentos | Conversas | Timeline

──────────────────────────────────────

ATIVIDADE RECENTE

Hoje
Pagamento confirmado

Ontem
Consulta odontológica

12 ago
WhatsApp respondido
```

---

# 72. PAGE ANATOMY — EMPRESA 360

```text
Supermercados Bandeirantes S.A.

CNPJ 98.765.432/0001-15
Matriz · Mauá/SP
CNAE 47.11-3-02

[Representação disputada]

──────────────────────────────────────

Trabalhadores   Arrecadação   Débitos
312             R$ 18,4 mil   R$ 4,8 mil

Homologações    Fiscalização
3 abertas       1 pendência

──────────────────────────────────────

Visão geral
Representação
Trabalhadores
Arrecadação
Homologações
Fiscalização
Documentos
Conversas
Timeline
```

---

# 73. REPRESENTAÇÃO — REFATORAÇÃO DA TELA ATUAL

A tela mostrada deverá ser profundamente redesenhada.

Não usar:

* fundo nude;
* serif gigante;
* timeline excessivamente editorial;
* terracota como protagonista.

---

# 74. NOVA TELA DE REPRESENTAÇÃO

Estrutura recomendada:

```text
Supermercados Bandeirantes S.A.
CNPJ 98.765.432/0001-15

[REPRESENTAÇÃO DISPUTADA]

──────────────────────────────────────

SITUAÇÃO EM 19/08/2026

2 entidades reivindicam representação.

[Ver evidências] [Registrar decisão]

──────────────────────────────────────

LINHA DE VIGÊNCIA

2022       2023                2026      2027
───────────████████████████████────────────
Sem rep.    SECABC             Disputada

──────────────────────────────────────

REIVINDICAÇÕES

Sindicato dos Comerciários do ABC
Base: Carta sindical...
Evidência: CCT 2026/2027
Status: Reconhecida até 28/02/2026

Sindicato dos Comerciários de Mauá
Base: decisão judicial...
Status: Reivindicação ativa

──────────────────────────────────────

CONVENÇÃO VIGENTE

CCT 2026/2027
Registro MR012345/2026
01/03/26 → 28/02/27

──────────────────────────────────────

AUDITORIA

Última alteração
18/08/2026 14:31
por Ana Souza
```

Mais sistema.

Menos editorial.

---

# 75. PAGE ANATOMY — FINANCEIRO

```text
Financeiro

R$ 3.485.220
recebido no mês

R$ 418.320
em aberto

6,8%
inadimplência

─────────────────────────────────

Arrecadação | Cobranças | Recebimentos |
Conciliação | Inadimplência | Repasses

─────────────────────────────────

[Competência Ago/2026]
[Unidade Todas]
[Tipo Todos]

Tabela
```

---

# 76. PAGE ANATOMY — ATENDIMENTO

Atendimento deve parecer workstation.

```text
ATENDIMENTO

[Buscar CPF, nome ou telefone...]

────────────────────────────────

FILA

1. João Silva
   Atualização cadastral
   aguardando 04:21

2. Maria Santos
   Associação
   aguardando 07:13

────────────────────────────────

MINHA AGENDA

09:30 Psicologia
10:00 Atendimento presencial
...
```

---

# 77. PAGE ANATOMY — HOMOLOGAÇÃO

Kanban pode ser útil apenas se trouxer benefício real.

Exemplo:

```text
Recebidas
Em análise
Pendência
Agendadas
Concluídas
```

Mas o modo principal poderá ser tabela operacional.

Usuário alterna:

```text
Tabela | Pipeline
```

---

# 78. PAGE ANATOMY — FISCALIZAÇÃO

```text
Fiscalização

[Mapa] [Lista]

124 empresas prioritárias

─────────────────────────────

Prioridade alta
32

Sem visita > 12 meses
84

Pendências abertas
27
```

Mapa + lista sincronizados.

---

# 79. SYNTEX INTELLIGENCE

Não utilizar chatbot flutuante genérico.

Criar uma camada de inteligência integrada.

Entrada:

```text
⌘ J
Pergunte ao Syntex...
```

---

# 80. INTELLIGENCE CARD

Exemplo:

```text
✦ SYNTEX INTELLIGENCE

Identifiquei aumento de 14,2% na inadimplência
das empresas de Mauá nos últimos 60 dias.

R$ 184.390 estão concentrados em 37 empresas.

[Analisar empresas]
[Criar tarefa de cobrança]
```

Design sóbrio.

Não roxo.

Não gradiente de IA.

---

# 81. IA CONTEXTUAL

Dentro de Empresa:

```text
✦ Resumir situação
```

Dentro de Trabalhador:

```text
✦ Preparar atendimento
```

Dentro de Financeiro:

```text
✦ Analisar inadimplência
```

Dentro de Fiscalização:

```text
✦ Priorizar visitas
```

---

# 82. ACTION CONFIRMATION

Ações destrutivas exigem confirmação contextual.

Não:

```text
Tem certeza?
```

Preferido:

```text
Cancelar cobrança

Cobrança
#C-84921

Empresa
XPTO Ltda.

Valor
R$ 4.812,00

O cancelamento ficará registrado
permanentemente na auditoria.

Motivo *
[                       ]

[Voltar] [Cancelar cobrança]
```

---

# 83. DESIGN TOKENS

Estrutura:

```text
color
typography
spacing
radius
shadow
motion
z-index
breakpoints
density
```

Todos centralizados.

Não espalhar valores arbitrários pelo código.

---

# 84. SPACING SCALE

Base 4px.

```text
1 = 4
2 = 8
3 = 12
4 = 16
5 = 20
6 = 24
8 = 32
10 = 40
12 = 48
```

---

# 85. Z-INDEX

Definir desde o início.

```text
base
sticky
dropdown
popover
drawer
modal
command
toast
```

Evita guerra de `z-index: 999999`.

---

# 86. STORYBOOK

Recomendo fortemente:

# Storybook

Para documentar Syntex UI.

Cada componente deverá possuir:

* default;
* variants;
* loading;
* empty;
* error;
* disabled;
* dark surface;
* accessibility.

---

# 87. VISUAL REGRESSION

Adicionar posteriormente:

* Chromatic;
* Playwright screenshots;

ou equivalente.

Alteração em CSS não pode quebrar 40 módulos silenciosamente.

---

# 88. E2E FRONT-END

Playwright.

Testar jornadas:

```text
buscar trabalhador
abrir perfil
iniciar atendimento
criar agendamento
```

E:

```text
buscar empresa
abrir arrecadação
gerar cobrança
```

---

# 89. PERFORMANCE BUDGET

Syntex precisa parecer rápido.

Definir budgets para:

* JS bundle;
* initial load;
* table interaction;
* command search;
* page transition.

Não carregar bibliotecas inteiras para usar 5% delas.

---

# 90. VIRTUALIZAÇÃO

Listagens extremamente grandes:

```text
TanStack Virtual
```

quando necessário.

Não renderizar milhares de linhas no DOM.

---

# 91. PERCEIVED PERFORMANCE

Utilizar:

* optimistic UI quando seguro;
* streaming;
* skeleton;
* prefetch;
* cached queries.

Operação longa:

```text
Gerando 38.420 cobranças...

12.421 processadas
██████████░░░░░ 32%
```

Nunca bloquear usuário por minutos.

---

# 92. CONTENT DESIGN

A linguagem também faz parte do design.

Evitar:

> “Processo executado com sucesso.”

Preferir:

> “Cobrança criada.”

Evitar:

> “Não foi possível realizar a operação solicitada.”

Preferir:

> “Não conseguimos registrar o pagamento. Tente novamente.”

---

# 93. FORMATAÇÃO BRASILEIRA

Centralizar:

```text
CPF
CNPJ
CEP
telefone
moeda
percentual
datas
competência
```

Nunca formatar manualmente em 30 componentes diferentes.

---

# 94. DESIGN REVIEW

Nenhuma feature crítica deve chegar a produção porque:

> “está funcionando.”

Review obrigatório:

```text
UX
Visual
Accessibility
Responsiveness
Permissions
Error states
Loading
Empty state
```

---

# 95. DEFINITION OF DONE — FRONT

Uma tela não está pronta enquanto faltar:

```text
Desktop ✓
Responsive ✓
Loading ✓
Empty ✓
Error ✓
Permission ✓
Keyboard ✓
Accessibility ✓
Analytics ✓
Test ✓
```

---

# 96. GOVERNANÇA DO DESIGN SYSTEM

Qualquer novo padrão visual deve responder:

> Já existe componente Syntex que resolve isso?

Se não:

> É específico desta tela ou é um novo primitive?

Não criar variantes aleatórias.

---

# 97. REGRA PARA IA GERANDO FRONT-END

Claude, Codex ou qualquer agente NÃO poderá:

* inventar paleta;
* inventar radius;
* criar novo card style;
* usar gradiente;
* alterar spacing system;
* adicionar library visual;
* escolher novo ícone;
* inventar botão.

Deverá usar exclusivamente Syntex UI.

---

# 98. COMPONENT CONTRACTS

Exemplo:

```text
<SyntexDataTable />

<SyntexPageHeader />

<SyntexMetric />

<SyntexTimeline />

<SyntexStatus />

<SyntexDrawer />

<SyntexCommand />
```

A IA trabalha sobre primitives proprietários.

Isso reduz drasticamente o efeito:

> “cada página parece feita por um gerador diferente.”

---

# 99. PRIMEIRAS TELAS A SEREM DESENHADAS

Antes de produzir o sistema inteiro:

### 01 — Shell

Sidebar + topbar + command.

### 02 — Dashboard

Visão operacional.

### 03 — Empresa 360

Entidade complexa.

### 04 — Trabalhador 360

Segunda entidade central.

### 05 — DataTable

Empresas.

### 06 — Representação

Domínio sindical.

### 07 — Atendimento

Operação.

### 08 — Financeiro

Alta densidade.

### 09 — Drawer/Form

Criação/edição.

### 10 — Syntex Intelligence

IA contextual.

Se essas dez estiverem corretas, conseguimos derivar grande parte do restante.

---

# 100. REGRA VISUAL FINAL

Sempre que surgir uma decisão entre:

> “mais bonito”

e:

> “mais claro, rápido e poderoso”

o Syntex escolhe:

# claro, rápido e poderoso.

A beleza deverá surgir da precisão.

---

# 101. RESULTADO DESEJADO

Ao entrar no Syntex pela primeira vez, um dirigente sindical deve pensar:

> “Aqui eu consigo controlar minha operação.”

Um funcionário:

> “Isso vai facilitar meu trabalho.”

Um gestor:

> “Finalmente consigo enxergar o todo.”

Um desenvolvedor:

> “Existe um sistema por trás disso.”

E um concorrente:

> “Isso não parece mais um ERP sindical.”

---

# 102. NORTE DEFINITIVO

## Syntex não é um dashboard.

## Syntex não é um template.

## Syntex não é um ERP maquiado.

# Syntex é o sistema operacional da gestão sindical.

E toda decisão de front-end deve transmitir exatamente isso.
