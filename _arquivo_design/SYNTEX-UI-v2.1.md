# Syntex UI — Visual System v2.1

## Premium Surface Language

Lei do front-end. Toda tela do Syntex obedece a este documento. Se algo aqui conflita com um impulso estético no meio de uma tarefa, este documento vence.

**Referência visual:** Lovable (`syntex-vital-core`) — força e acabamento. **Engenharia:** arquitetura Syntex (domínio, Supabase, RLS, permissões, Server Components, feature ownership) permanece soberana. Não copie mocks, APIs ou dados da referência.

**Checkpoint shell:** App Shell v2 congelado (`9aeff69`). Sidebar/topbar estruturais não se redesenham nesta gramática — só herdam tokens.

---

## 0. Filosofia v2.1

O Syntex é um **registro de estados jurídicos ao longo do tempo**. Não é dashboard genérico, CRM ou ERP maquiado.

Consequência visual:

> **A distinção do Syntex vive na estrutura, no contraste funcional e no controle consistente de superfície — não em austeridade vazia nem em decoração.**

### Correção da austeridade v2

| Evitar | Preferir |
|--------|----------|
| “Nunca usar cards” | Cards **com função** (agrupamento semântico real) |
| “Nunca usar cor” | Cor **com hierarquia** (tint / rail / status) |
| “Nunca usar sombra” | Elevação **em 3 níveis** nomeados |
| “Nunca arredondar” | Radius **semântico** (control / panel / feature) |
| Inventar métrica visual | Métrica visual **só com denominador real** |

Premium ≠ ausência de elementos. Premium = controle consistente.

### Assinaturas de produto

1. **Temporalidade na chrome** — competência e unidade na topbar; vigência no conteúdo.
2. **Sidebar command dark** — uma grande superfície deep no shell; workspace claro.
3. **Mono em identificadores** — CNPJ, CPF, processo, Mediador, competência, protocolo, valor.
4. **Dois sistemas de cor** — sistema vs domínio (nunca misturados).
5. **Painéis dark com função** — command / radar / intelligence — nunca neon.

### Princípio dark / light

~70% claras · ~20% profundas · ~10% accent/status.  
Máximo ~2 grandes superfícies dark relevantes por viewport de conteúdo (além da sidebar).

---

## 1. Superfícies e tinta

```css
--paper:         oklch(0.972 0.007 245);
--surface:       oklch(1 0 0);
--surface-2:     oklch(0.952 0.008 245);
--border:        oklch(0.9 0.01 243);
--border-strong: oklch(0.8 0.014 243);
--ink / --ink-2 / --ink-3
```

### Hierarquia de superfície (utilities)

| Classe | Uso |
|--------|-----|
| `surface-base` | Fundo do workspace (`paper`) |
| `surface-raised` | Painel elevado (borda sutil + `shadow-raised` + `rounded-panel`) |
| `surface-inset` | Seção embutida / zebra / inset |
| `surface-selected` | Seleção (`tint-blue`) |
| `surface-attention` | Atenção operacional (`tint-amber`) |
| `surface-command` | Sidebar / chrome command |
| `surface-dark` | Painel dark de conteúdo (radar, intelligence) |

Não inventar `bg-*` + `shadow-*` ad hoc quando uma destas classes resolve.

---

## 2. Cor de ação e shell

```css
--petrol-900 … --petrol-100   /* ação: petrol-600 */
--teal                         /* accent secundário / rail ativo */
--shell-*                      /* cromo da sidebar */
```

---

## 3. Dois sistemas de cor

**Sistema:** `--success` · `--warning` · `--danger` · `--info`  
**Domínio:** `--st-reconhecida` … `--st-sensivel` (+ backgrounds)

`disputada` ≠ `danger`. Estado nunca só por cor (cor + texto + ícone).

### Semantic tints (~6–8%)

```css
--tint-teal | --tint-blue | --tint-green | --tint-amber | --tint-red
```

Classes: `bg-tint-teal` … `bg-tint-red`.  
Uso: selected, attention, área de métrica, track context, radar, destaque operacional.  
**Não** usar como decoração gratuita.

### Accent rail

Primitive `SyntexAccentRail` / `SyntexAccentFrame`.  
Tons: `teal | blue | green | amber | red`.  
Placement: `start` (lateral) ou `top`. Discreto — sem glow.

---

## 4. Tipografia

```
UI          Manrope
Identificador JetBrains Mono
```

| Papel | Token / classe | Peso |
|-------|----------------|------|
| Page title | `text-page-title` (26px) | 600 |
| Section | `text-section` (18px) | 600 |
| Panel title | `text-component` (15px) | 600 |
| Metric primary | `text-metric` (28px) | 600 |
| Metric secondary | `text-metric-sm` (20px) | 600 |
| Body | `text-body` (14px) | 400 |
| Dense / caption | `text-dense` / `text-label` | 400–500 |

**Piso:** ≥ 11.5px · ≥ 4.5:1.  
Premium ≠ tudo 700. Preferir semibold/600.  
`tabular-nums` via `.font-mono`.

---

## 5. Densidade

Comfortable (44/40) · Compact (36/36). Espaçamento base 4px: `4 8 12 16 20 24 32 40 48`.

---

## 6. Forma — radius e elevation

### Radius

| Semântico | Token | Tailwind | Uso |
|-----------|-------|----------|-----|
| chip | `--r-xs` 4px | `rounded-xs` | badge miúdo |
| **control** | `--r-control` 8px | `rounded-control` / `rounded-sm` | input, botão, chip |
| **panel** | `--r-panel` 12px | `rounded-panel` / `rounded-md` | painéis, cards com função |
| **feature** | `--r-feature` 14px | `rounded-feature` / `rounded-lg` | command / feature block |

Não espalhar `rounded-[Npx]`.

### Elevation (3 níveis)

| Nível | Token | Tailwind | Uso |
|-------|-------|----------|-----|
| **surface** | `--shadow-surface` | `shadow-surface` / `shadow-none` | flat + borda |
| **raised** | `--shadow-raised` | `shadow-raised` / `shadow-sm` | painéis elevados |
| **overlay** | `--shadow-overlay` | `shadow-overlay` / `shadow-elevated` | dropdown, dialog, popover |

Sombras frias, leves — sem Material preto pesado.

`z-index` nomeado: `base · sticky · dropdown · popover · drawer · modal · command · toast`.

---

## 7. Cards e painéis

Card / painel existe quando há **agrupamento semântico real**. Um único número não vira card isolado por decoração.

### Primitive `SyntexPanel`

```
SyntexPanel (variant: standard | raised | inset | dark | attention)
├── SyntexPanelHeader / SyntexPanelHeaderDark
│   ├── SyntexPanelTitle
│   └── SyntexPanelDescription
├── SyntexPanelBody
└── SyntexPanelFooter? 
```

Prop opcional `rail` (accent). Dark panel = assinatura Syntex (navy profundo, gradiente quase imperceptível, divisores shell, accents semânticos — sem neon/purple AI).

---

## 8. Métricas

Padrão: **LABEL · VALUE · CONTEXT · VISUAL?**  
Primitive `SyntexMetric` — `size`: `primary | secondary | inline`; `onDark`; `rail`; `visual` (ex.: `SyntexProgress`).

`SyntexMetricBar` agrupa com divisores (alternativa ao card-grid).

---

## 9. Progress / metric track

Primitive `SyntexProgress`: track neutro (`bg-track` / `bg-track-dark`) + fill semântico + `rounded-full`.  
**Só** com denominador válido (proporção real). Sem denominador → não renderizar.

---

## 10. Table / row language

Ainda sem redesenho global de todas as tabelas. Gramática:

| Classe / padrão | Uso |
|-----------------|-----|
| `row-hover` | hover de linha |
| `row-selected` | seleção (`tint-blue`) |
| `row-attention` | atenção (`tint-amber`) |
| divisores `divide-border/50` | ritmo |
| status tint + texto | nunca só cor |
| mono em CNPJ/datas/valores | identificadores |

Listas futuras não devem parecer “admin Bootstrap”.

---

## 11. Form language

Não redesenhar formulários nesta etapa. Controles obedecem v2.1:

- radius `rounded-control`
- border / hover `border-strong`
- focus `petrol-600`
- disabled `surface-2`
- validação `text-danger`

`SyntexField` permanece o contrato — não criar inputs locais.

---

## 12. Layout — App Shell

```
Sidebar 240 / 68 — surface-command
Topbar 64 — surface clara
Workspace — paper
```

Mapa de navegação e `built`/`permissions`: ADR-017. Existência visual ≠ acesso.

---

## 13. Contratos de componente

O agente **compõe primitives `Syntex*`, não inventa**.

```
SyntexPageHeader   SyntexDataTable   SyntexMetric / SyntexMetricBar
SyntexPanel*       SyntexProgress    SyntexAccentRail / SyntexAccentFrame
SyntexStatus       SyntexValidityBand SyntexTimeline
SyntexDrawer       SyntexCommand     SyntexEmptyState
SyntexConfirm      SyntexField       SyntexSensitive
SyntexCompetenceScope
```

Ícones do shell: `lucide-react`.

---

## 14. O que o agente NÃO pode fazer

Sem perguntar:

- cor / radius / sombra / espaçamento / tipo fora dos tokens
- novo estilo de botão ou card paralelo ao `SyntexPanel`
- ilustração decorativa / emoji em UI
- lib visual nova sem necessidade
- `shadcn add` com default cru
- número literal de cor/tamanho/z-index em componente
- mocks/dados da referência Lovable
- `if (tenant === 'secabc')`

Gradiente: só superfícies dark funcionais (`surface-command`, `surface-dark`, hero documentado).

---

## 15. Estados obrigatórios

loading · empty · error · sem permissão · teclado · foco visível.

---

## 16. Confirmação destrutiva

Nunca “Tem certeza?” genérico — impacto concreto + motivo quando audita.

---

## 17. Linguagem e formatters

Frases curtas. CPF/CNPJ/moeda/data/competência em `lib/formatters`.

---

## 18. Organização

```
features/<dominio>/
components/ui/     ← primitives Syntex (v2.1)
components/layout/ ← shell (congelado estruturalmente)
```

Server Components por padrão. URL = estado. RLS = isolamento; autorização rica na app.

---

## 19. Do / Don’t (resumo)

**Do:** surface-raised para painéis com função · tint para atenção · rail para prioridade · progress com denominador · métrica com valor dominante · dark panel sóbrio.

**Don’t:** 4 cards iguais para 4 números · sombra Material · purple gradient · glow · inventar % de crescimento · arbitrary `rounded-[14px]` · misturar `disputada` com `danger`.

---

## 20. Fora de escopo agora

Storybook · visual regression · dark mode global · PWA · chart lib · white label · redesenho estrutural de Sidebar/Topbar · aplicação deliberada ao Dashboard (Stage 2).
