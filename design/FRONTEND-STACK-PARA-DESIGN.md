# Relatório técnico — Front-end Syntex (para Design / Design Engineering)

**Data:** 2026-08-21  
**App:** `apps/web` (Next.js App Router)  
**Lei visual:** [`design/SYNTEX-UI.md`](./SYNTEX-UI.md)  
**Objetivo deste doc:** abrir as camadas de como o front está sendo construído, o que é componente real vs HTML solto, e o que um design/dev precisa respeitar para redesenhar o painel do sindicato.

---

## 1. Resposta rápida

| Pergunta | Resposta |
|----------|----------|
| CSS puro? | Quase não. Estilos via **Tailwind CSS 3.4** + **CSS variables** em `:root`. |
| Design system de mercado? | **Não** usamos Material / Chakra / Ant. Não usamos shadcn “como produto”. |
| O que usamos? | **Tokens Syntex** + primitives `Syntex*` + **Radix** só como comportamento (focus, portal, a11y). |
| Onde vive a identidade? | Em **estrutura** (faixa de vigência, mono em IDs, dois sistemas de cor), não em gradiente/card template. |

---

## 2. Camadas (de cima para baixo)

```
┌─────────────────────────────────────────────────────────────┐
│  app/(shell)/**/page.tsx     Server Components (dados+RLS)  │
│  features/<domínio>/*        Forms client, tabelas, colunas │
├─────────────────────────────────────────────────────────────┤
│  components/layout/*         Shell, Sidebar, Topbar, nav    │
│  components/ui/syntex-*      Primitives de produto          │
│  components/ui/{dropdown,popover}  Radix thin wrappers      │
├─────────────────────────────────────────────────────────────┤
│  Tailwind utilities          bg-paper, text-ink, h-input…   │
│  app/globals.css             :root tokens (= SYNTEX-UI.md)  │
│  tailwind.config.ts          só mapeia var() → classes      │
├─────────────────────────────────────────────────────────────┤
│  packages/validation         Zod (contratos de form/API)    │
│  packages/permissions        Can / grants (UI + API)        │
│  packages/database           Supabase tipado                │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Runtime / framework

- **Next.js 14.2** (App Router)
- **React 18**
- **TypeScript**
- Server Components por padrão; Client Components só onde há estado (`"use client"`): forms, tabela, sidebar path active, menus.

### 2.2 Estilo

1. **`design/SYNTEX-UI.md`** — fonte da verdade (lei).  
2. **`apps/web/app/globals.css`** — tradução literal em `--tokens`.  
3. **`apps/web/tailwind.config.ts`** — **não inventa valores**; só liga `bg-paper` → `var(--paper)`, etc.  
4. Componentes usam **classes Tailwind semânticas** (`bg-petrol-800`, `text-ink-3`, `h-input`, `rounded-sm`), nunca `#hex` nem `z-[999]` no JSX.

PostCSS: `tailwindcss` + `autoprefixer` (`postcss.config.mjs`).

Utilitários: `clsx` + `tailwind-merge` via `@/lib/utils` (`cn()`).

### 2.3 Tipografia (carregada no root layout)

| Papel | Fonte | Uso |
|-------|--------|-----|
| UI / corpo | **Inter** (`--font-sans`) | quase tudo |
| Display | **Source Serif 4** (`--font-serif`) | wordmark + `h1` da página |
| Identificador | **IBM Plex Mono** (`--font-mono`) | CNPJ, CPF, valores, tokens |

Piso: **≥ 11.5px**, contraste **≥ 4.5:1**.

---

## 3. Tokens (o que o design deve editar)

Arquivo: [`apps/web/app/globals.css`](../apps/web/app/globals.css)

### Superfícies

- `--paper` fundo app  
- `--surface` / `--surface-2` painéis e zebra  
- `--border` / `--border-strong`

### Texto

- `--ink` / `--ink-2` / `--ink-3`

### Ação (nunca superfície grande)

- `--petrol-900` … `--petrol-100`

### Shell (sidebar escura)

- `--shell-950`, `--shell-900`, `--shell-ink`, …

### Dois sistemas de cor (não misturar)

- **Sistema:** `--success` `--warning` `--danger` `--info`  
- **Domínio jurídico:** `--st-reconhecida`, `--st-reivindicada`, `--st-disputada`, `--st-perdida`, `--st-sensivel` (+ `-bg`)

Regra de produto: **`disputada` ≠ `danger`**.

### Forma / densidade

- Radius: `--r-xs` 3px, `--r-sm` 5px, `--r-md` 7px (**proibido** 16/20/24)  
- Densidade: `--row-h`, `--input-h` (comfortable 44/40; compact 36/36 via `[data-density=compact]`)  
- z-index nomeado: `--z-dropdown` … `--z-toast`

**Fluxo correto para o design:** mudar SYNTEX-UI.md → atualizar `:root` → classes Tailwind já refletem. Não criar paleta paralela no Figma sem espelhar tokens.

---

## 4. Primitives reais (`components/ui`)

Contrato da lei (§9): o time **compõe `Syntex*`, não inventa** botão/card novo.

### Implementados e em uso

| Componente | Arquivo | Função |
|------------|---------|--------|
| `SyntexPageHeader` | `syntex-page-header.tsx` | breadcrumb → título serif → metadata → actions |
| `SyntexDataTable` | `syntex-data-table.tsx` | tabela TanStack Table v9 + seleção + paginação UI |
| `SyntexStatus` | `syntex-status.tsx` | estado domínio **ou** sistema (dois modos) |
| `SyntexValidityBand` | `syntex-validity-band.tsx` | faixa de vigência (assinatura visual) |
| `SyntexEmptyState` | `syntex-empty-state.tsx` | empty / sem permissão |
| `SyntexField` | `syntex-field.tsx` | label + slot (ainda pouco adotado nos forms novos) |
| `SyntexSelect` | `syntex-select.tsx` | select de filtro (lista empresas) |
| `SyntexCommand` | `syntex-command.tsx` | command palette (cmdk) na topbar |
| Ícones | `icons.tsx` | set local, não Lucide/Heroicons de lib |

### Radix (comportamento, não visual de produto)

- `@radix-ui/react-dropdown-menu` → `dropdown-menu.tsx`  
- `@radix-ui/react-popover` → `popover.tsx`  
- Também na stack: dialog, select, slot, visually-hidden  

**Proibido:** `npx shadcn add` e ficar com o look default (cinza/azul genérico). Radix = headless; skin = tokens Syntex.

### Previstos na lei, ainda não (ou pouco) materializados

`SyntexMetric`, `SyntexTimeline`, `SyntexDrawer`, `SyntexConfirm`, `SyntexSensitive` — o dashboard atual usa `<dl>` + links, não `SyntexMetric` ainda.

---

## 5. Layout do painel do sindicato

```
components/layout/
  shell.tsx        Server: sessão, filtra nav por permissão, monta chrome
  sidebar.tsx      Client: 248px shell-950, seções, item ativo
  topbar.tsx       58px: command + user menu
  nav-config.ts    Árvore de navegação + permission keys
```

**Nav atual (produto):** Início → Cadastro (Empresas, Trabalhadores) → Financeiro → Atendimento → Operação.

Rotas principais sob `app/(shell)/` (grupo sem segmento de URL):

- `/painel` — dashboard operacional  
- `/empresas`, `/empresas/nova`, `/empresas/[id]`  
- `/trabalhadores`, `/trabalhadores/novo`  
- `/filiacao` — placeholder Atendimento  
- `/cobrancas`, `/convencoes`, `/equipe`, `/escritorios`

Autorização na UI: permissão some da nav (`filterNavSections`). **Segurança real** continua na API + RLS — UI não é fence.

---

## 6. Feature ownership (domínio)

Cada domínio tem pasta própria (regra do monorepo):

```
features/
  companies/     create-company-form, companies-table, columns, data
  workers/       create-worker-form, data, membership helpers
  charges/       forms e actions de cobrança
  dashboard/     fetchUnionDashboard
  …
```

Padrão típico de tela:

1. **Server page** busca dados com Supabase (JWT do user).  
2. Passa props para **Client form/table**.  
3. Submit → `fetch('/api/...')` → Zod em `packages/validation` → domínio em `lib/domain/*`.  
4. Audit/outbox no servidor quando write importa.

Forms recentes (`create-company-form`, `create-worker-form`) ainda misturam **`<input className={inputClass}>` local** em vez de sempre `SyntexField` — dívida técnica consciente; o redesign deve **unificar no primitive**, não criar terceiro estilo de input.

---

## 7. Estado e dados no client

- **TanStack Query** — na stack; usado onde faz sentido para server state (não é Redux).  
- **TanStack Table v9** — dentro de `SyntexDataTable`.  
- **URL = estado de filtro** (`searchParams`: `q`, `municipio`, `status`, `page`) — ver `companies-table.tsx`.  
- **React Hook Form + Zod** — dependências presentes; vários forms ainda usam `FormData` manual (também dívida para alinhar).

---

## 8. O que o front “é” hoje vs o que o redesign deve atacar

### Já sólido (infra de UI)

- Pipeline token → Tailwind  
- Shell + PageHeader + DataTable + Status + ValidityBand  
- Separação domínio vs sistema de cor  
- Ownership por `features/`

### Ainda “CRUD operacional cru” (onde o design agrega mais)

- Densidade visual inconsistente entre forms (empresa vs trabalhador vs cobranças)  
- Labels/copy (em parte já corrigido para PT-BR operacional)  
- Poucos empty/loading/skeleton estruturais  
- Dashboard enxuto sem `SyntexMetric` / summary bar da lei  
- Ficha empresa ainda híbrida (contato novo + representação antiga)  
- Assinatura “Vigência em” como moldura permanente **não** está no chrome global ainda

### Fora de escopo do ciclo atual

Portais `/empresa`, `/associado`, `/escritorio` — espelho; não redesenhar agora.

---

## 9. Checklist para o Design / Design Engineering

1. **Ler** `design/SYNTEX-UI.md` completo antes de Figma.  
2. **Espelhar tokens** 1:1 (nomes `--petrol-*`, `--st-*`, radius 3/5/7).  
3. **Compor telas** com anatomia: breadcrumb → título → metadata → actions → conteúdo.  
4. **Entregar specs** em componentes mapeáveis para `Syntex*` (ou propor novo `SyntexX` com variants).  
5. **Não** propor card-grid de métricas estilo SaaS genérico; summary bar / densidades da lei.  
6. **Estados:** loading estrutural, empty com próxima ação, erro, sem permissão, foco teclado.  
7. **Mono** em todo CNPJ/CPF/competência/protocolo.  
8. Protótipo prioritário do ciclo: **Cadastro → Nova empresa** + **lista Empresas** + **Painel**.

### Entregáveis sugeridos do design

- Figma com página de tokens (cores, type, density)  
- Wire + hi-fi de: `/painel`, `/empresas`, `/empresas/nova`, `/trabalhadores/novo`  
- Component inventory batendo com a tabela da §4  
- Notas de interação (filtros URL, faixa de vigência, status domínio)

### Entregáveis sugeridos do engineering (já no repo)

- Implementar specs via tokens + primitives  
- Extender `SyntexField` / botões padronizados se o design exigir variants  
- Manter forms atrás de Zod + API existente  

---

## 10. Referências no repo

| Artefato | Path |
|----------|------|
| Lei UI | `design/SYNTEX-UI.md` |
| Tokens CSS | `apps/web/app/globals.css` |
| Bridge Tailwind | `apps/web/tailwind.config.ts` |
| Primitives | `apps/web/components/ui/` |
| Shell | `apps/web/components/layout/` |
| Form empresa | `apps/web/features/companies/create-company-form.tsx` |
| Checklist Cadastro | `fundacao/07-checklist-cadastro-empresa.md` |
| Domínio Cadastro vs Atendimento | `decisoes/ADR-016-cadastro-atendimento-vinculo-empresa.md` |

---

## 11. Uma frase para o design partner

> O Syntex não é um tema Tailwind genérico: é um sistema operacional sindical com tokens próprios, primitives `Syntex*`, Radix só no comportamento, e identidade em vigência + mono + dois sistemas de cor — o redesign entra **por cima dessa lei**, não no lugar dela.
