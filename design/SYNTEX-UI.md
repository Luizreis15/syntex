# Syntex UI — Visual System v2

Lei do front-end. Toda tela do Syntex obedece a este documento. Se algo aqui conflita com um impulso estético no meio de uma tarefa, este documento vence.

**Referência visual aprovada:** implementação Lovable (`syntex-vital-core`) — soberana para linguagem visual. A arquitetura Syntex (domínio, Supabase, RLS, permissões, Server Components, feature ownership) permanece soberana para engenharia. Não copie mocks, APIs ou estrutura de dados da referência.

---

## 0. A tese

O Syntex é um **registro de estados jurídicos ao longo do tempo**. Não é um dashboard genérico, não é um CRM, não é um ERP maquiado.

Consequência visual:

> **A distinção do Syntex vive na estrutura e no contraste funcional — não em decoração.**

Assinaturas de produto (v2):

1. **Temporalidade na chrome** — competência (mês/ano) e escopo de unidade na topbar; entidades com vigência continuam com faixa/banda no conteúdo.
2. **Sidebar command dark** — única grande superfície deep por viewport no shell; o workspace é claro.
3. **Mono em todo identificador** — CNPJ, CPF, processo, Mediador, competência, protocolo, valor.
4. **Dois sistemas de cor separados**, nunca misturados (ver §3).

### Princípio dark / light

Aplicação predominantemente clara (~70% superfícies claras · ~20% superfícies profundas · ~10% accent/status).

Áreas escuras têm função (sidebar command, hero de dashboard, Intelligence `hero-dark`). Empresa 360 e Trabalhador 360 usam cabeçalhos claros. Não voltar a fundo bege, estética editorial ou serifa em UI funcional.

---

## 1. Superfícies e tinta

Neutro **frio** (oklch). Não é bege, não é creme editorial.

```css
--paper:         oklch(0.968 0.006 240); /* fundo do workspace */
--surface:       oklch(1 0 0);           /* painéis, tabelas, drawers */
--surface-2:     oklch(0.945 0.008 240); /* cabeçalho de tabela, zebra, hover */
--border:        oklch(0.885 0.011 243);
--border-strong: oklch(0.78 0.016 243);

--ink:   oklch(0.24 0.037 252); /* texto principal */
--ink-2: oklch(0.4 0.03 250);   /* secundário */
--ink-3: oklch(0.53 0.026 248); /* meta / rótulo — nunca corpo de leitura */
```

## 2. Cor de ação — escala Syntex (nome de token: petrol)

Os nomes `petrol-*` permanecem por compatibilidade com o código existente; os valores são a escala navy/syntex da referência aprovada.

```css
--petrol-900: oklch(0.19 0.035 254); /* midnight */
--petrol-800: oklch(0.26 0.049 250); /* navy */
--petrol-700: oklch(0.32 0.052 249); /* navy-2 */
--petrol-600: oklch(0.56 0.115 236); /* ação: botão, link, foco, seleção */
--petrol-100: oklch(0.93 0.02 234);  /* tint suave */

--teal: oklch(0.7 0.109 187); /* rail do item ativo, accent secundário */
```

Cromo da sidebar (command surface):

```css
--shell-950: oklch(0.19 0.035 254);
--shell-900: oklch(0.26 0.049 250);
--shell-border: oklch(1 0 0 / 9%);
--shell-ink: oklch(0.97 0.006 240);
--shell-ink-2: oklch(0.73 0.023 240);
--shell-active: color-mix(in oklab, var(--petrol-600) 26%, transparent);
```

Fundo da sidebar: gradiente vertical `navy → midnight` (utilitário `surface-command` em CSS). Petrol/syntex em grandes áreas só quando a superfície dark tem função (sidebar, hero).

## 3. Os dois sistemas de cor

**Estado de sistema** — o software funcionou ou não:

```css
--success: oklch(0.63 0.126 158);
--warning: oklch(0.76 0.135 78);
--danger:  oklch(0.6 0.171 22);
--info:    oklch(0.7 0.109 187);
```

**Estado de domínio** — a situação jurídica da coisa no mundo (lei de produto; independente da estética v2):

```css
--st-reconhecida:#15754E;  --st-reconhecida-bg:#E8F2ED;
--st-reivindicada:#B07208; --st-reivindicada-bg:#FAF2E1;
--st-disputada:#B4541F;    --st-disputada-bg:#FAEFE7;
--st-perdida:#7A756C;      --st-perdida-bg:#EFEDE9;
--st-sensivel:#6B3F8C;     --st-sensivel-bg:#F5F0F8;
```

**`disputada` não é `danger`.** Disputa de base é situação legítima, não erro do sistema. Vermelho puro fica para ação destrutiva e falha real.

**Estado nunca depende só de cor.** Sempre cor + ícone + texto (WCAG 2.2 AA).

## 4. Tipografia

```
UI e display   Manrope (sans)
Identificador  JetBrains Mono
```

Source Serif / Inter / IBM Plex **fora** da UI funcional. `font-serif` no CSS é alias de `font-sans` para não quebrar classes legadas.

```
Page title    26px / 700 / -0.02em    Manrope
Section       18px / 600              Manrope
Component     15px / 600              Manrope
Body          14px / 400              Manrope
Dense body    13px / 400              Manrope   (tabela compacta)
Label         11.5px / 500 / 0.055em uppercase
```

**Piso de legibilidade, inegociável:** nada abaixo de 11.5px, nada abaixo de 4.5:1. Quem opera tem 30 anos; quem assina tem 65.

`font-variant-numeric: tabular-nums` em todo número em coluna, comparação ou identificador.

## 5. Densidade

- **Comfortable** (padrão) — linha 44px, input 40px, body 14px.
- **Compact** — linha 36px, input 36px, body 13px.

Enterprise-tech: menos vazio editorial; hierarquia por peso tipográfico e agrupamento, não por whitespace excessivo.

## 6. Forma

```css
--r-xs: 4px; --r-sm: 6px; --r-md: 8px;   /* nunca 16, 20, 24 no chrome */
--shadow-sm: 0 1px 2px oklch(0 0 0 / 6%);
--shadow-elevated: 0 12px 32px oklch(0 0 0 / 14%), 0 2px 6px oklch(0 0 0 / 7%);
--overlay: oklch(0.19 0.035 254 / 45%);
```

Hierarquia por borda, superfície e espaçamento — sombra só em drawer/modal/command.

Espaçamento base 4px: `4 8 12 16 20 24 32 40 48`.

`z-index` nomeado: `base · sticky · dropdown · popover · drawer · modal · command · toast`.

## 7. Cards

Card existe quando há **agrupamento semântico real**. Um dado não vira card. Cinco métricas não viram cinco cards — viram summary bar com divisores. Proibido template-card.

## 8. Layout — App Shell

```
Sidebar   240px  (compacta 68px) — surface-command dark
Topbar    64px   — surface clara / blur
Workspace — paper claro
```

Anatomia do shell:

```
SyntexAppShell
├── SyntexSidebar
│   ├── SyntexBrand
│   ├── TenantScope (informativo até existir troca real)
│   ├── NavigationGroup / NavigationItem
├── SyntexTopbar
│   ├── SyntexCommand (permission-aware)
│   ├── CompetenceScope (?competencia=)
│   ├── BranchScope
│   ├── Notifications
│   └── UserMenu
└── Workspace
```

Navegação por sete grupos (mapa aprovado). Item `built: false` aparece inerte (sem href); item `built: true` some se faltar permissão. Existência visual ≠ acesso. Ver ADR-017.

Anatomia de workspace de entidade (conteúdo — fases seguintes):

```
breadcrumb → título + status → metadata → ações
summary bar · tabs · conteúdo
```

## 9. Contratos de componente

O agente **compõe primitives `Syntex*`, não inventa**.

```
<SyntexPageHeader />   <SyntexDataTable />   <SyntexMetric />
<SyntexStatus />       <SyntexValidityBand /> <SyntexTimeline />
<SyntexDrawer />       <SyntexCommand />     <SyntexEmptyState />
<SyntexConfirm />      <SyntexField />       <SyntexSensitive />
<SyntexCompetenceScope />
```

Iconografia do shell: `lucide-react` alinhada à referência. Não adicionar outra lib de ícones.

## 10. O que o agente NÃO pode fazer

Sem perguntar antes, é proibido:

- inventar cor, radius, sombra, espaçamento ou escala tipográfica fora dos tokens
- criar novo estilo de card ou botão
- usar ilustração decorativa ou emoji em UI
- adicionar biblioteca visual fora da stack sem necessidade demonstrada
- usar `shadcn add` e ficar com o default
- pôr número literal de cor, tamanho ou z-index em componente
- copiar mocks/APIs/dados da referência Lovable
- `if (tenant === 'secabc')` em qualquer camada

Gradiente é permitido **somente** nas superfícies dark funcionais documentadas (sidebar command, hero Intelligence) — não como decoração de card.

## 11. Estados obrigatórios

Tela não está pronta sem: **loading (skeleton) · empty contextual · error · sem permissão · teclado · foco visível**.

## 12. Confirmação de ação destrutiva

Nunca "Tem certeza?". Mostra o que acontece com dados concretos; exige motivo quando entra em auditoria.

## 13. Linguagem

`"Cobrança criada."` — não `"Processo executado com sucesso."`

Formatação brasileira (CPF, CNPJ, CEP, telefone, moeda, data, competência) vive em `lib/formatters`. Nunca à mão no componente.

## 14. Organização

```
apps/web/
  features/<dominio>/   components · queries · actions · schemas · permissions
  components/ui/        primitives Syntex
  components/layout/    shell, sidebar, topbar, nav-config
  lib/formatters/
  lib/permissions/      <Can permission="..."> — UI não é fonte de segurança
```

Server Components por padrão. URL é estado (`searchParams`). Autorização rica na aplicação; RLS só isolamento de tenant.

## 15. Fora de escopo agora

Storybook · visual regression · dark mode global · PWA · ECharts · virtualização · density switcher na UI · white label · redesenho de Dashboard/Empresa/Trabalhador nesta fase de shell.
