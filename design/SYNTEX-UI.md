# Syntex UI — Sistema de Interface

Lei do front-end. Toda tela do Syntex obedece a este documento. Se algo aqui conflita com um impulso estético no meio de uma tarefa, este documento vence.

---

## 0. A tese

O Syntex é um **registro de estados jurídicos ao longo do tempo**. Não é um dashboard, não é um CRM, não é um ERP maquiado.

Isso tem consequência visual direta:

> **A distinção do Syntex vive na estrutura, não na cor.**

Cor um concorrente troca numa tarde. As quatro assinaturas abaixo exigem entender o domínio antes de imitar — e por isso são o ativo de marca:

1. **A faixa de vigência** aparece em toda entidade que tem prazo — representação, CCT, regra de contribuição, filiação, vínculo.
2. **A barra "Vigência em"** é moldura permanente do produto, não um seletor escondido. Tudo na tela é o que valia naquela data.
3. **Mono em todo identificador** — CNPJ, CPF, processo, Mediador, competência, protocolo, valor.
4. **Dois sistemas de cor separados**, nunca misturados (ver §3).

---

## 1. Superfícies e tinta

Base neutra levemente quente. **Não é bege, não é creme, e não é o cinza-azulado padrão de SaaS.**

```css
--paper:        #F6F5F3;   /* fundo da aplicação */
--surface:      #FFFFFF;   /* painéis, tabelas, drawers */
--surface-2:    #EDEBE7;   /* cabeçalho de tabela, campos, zebra */
--border:       #DDD9D3;
--border-strong:#C6C1B8;

--ink:   #1A1815;   /* texto principal — contraste 15:1 */
--ink-2: #4B4741;   /* secundário — 8:1 */
--ink-3: #7A756C;   /* meta e rótulo — nunca para texto de leitura */
```

## 2. Cor de ação — Petrol

Azul-petróleo profundo. Comunica confiança sem ser o cobalto que todo B2B usa, e fica longe o suficiente do verde de estado.

```css
--petrol-900:#0C303A;
--petrol-800:#0F3D4A;   /* botão primário, nav ativa */
--petrol-700:#155263;
--petrol-600:#1C6B80;   /* link, foco */
--petrol-100:#E4EEF1;   /* seleção, hover suave */
```

**Nunca** em grandes superfícies. Petrol é ação, navegação, seleção, foco e vínculo — não é preenchimento.

Cromo escuro da sidebar:

```css
--shell-950:#14171A;
--shell-900:#1C2126;
```

## 3. Os dois sistemas de cor

Esta é a regra mais importante do documento e a mais fácil de violar por descuido.

**Estado de sistema** — o software funcionou ou não:

```css
--success:#15754E;  --warning:#B07208;  --danger:#B3372C;  --info:#1C6B80;
```

**Estado de domínio** — a situação jurídica da coisa no mundo:

```css
--st-reconhecida:#15754E;  --st-reconhecida-bg:#E8F2ED;
--st-reivindicada:#B07208; --st-reivindicada-bg:#FAF2E1;
--st-disputada:#B4541F;    --st-disputada-bg:#FAEFE7;
--st-perdida:#7A756C;      --st-perdida-bg:#EFEDE9;
--st-sensivel:#6B3F8C;     --st-sensivel-bg:#F5F0F8;
```

**`disputada` não é `danger`.** Disputa de base é situação legítima e frequente, não erro do sistema. Vermelho puro fica reservado para ação destrutiva e falha real. Se um dia os dois sistemas colidirem numa tela, o de domínio recua para variação de peso e ícone — nunca se pinta de vermelho.

**Estado nunca depende só de cor.** Sempre cor + ícone + texto (WCAG 2.2 AA, e há daltônicos em qualquer diretoria).

## 4. Tipografia

```
UI e corpo    Inter
Display       Source Serif 4   — apenas wordmark e título de página
Identificador IBM Plex Mono
```

A serifa é assinatura, **não é tipografia funcional**. Ela aparece em exatamente dois lugares: o wordmark e o `<h1>` da página, no máximo a 28px. Título gigante ocupando 20% da tela é vaidade editorial — o Syntex é ferramenta operacional.

```
Page title    26–28px / 600 / -0.02em    Source Serif 4
Section       17–18px / 600              Inter
Component     14–15px / 600              Inter
Body          14px    / 400              Inter
Dense body    13px    / 400              Inter   (só em tabela compacta)
Label         11.5px  / 500 / 0.055em uppercase
```

**Piso de legibilidade, inegociável:** nada abaixo de 11.5px, nada abaixo de 4.5:1 de contraste. Quem opera tem 30 anos; quem assina o contrato tem 65. Os dois precisam enxergar.

`font-variant-numeric: tabular-nums` em **todo** número que aparece em coluna, comparação ou identificador.

## 5. Densidade

Dois modos, tokenizados desde o início:

- **Comfortable** (padrão) — linha de tabela 44px, input 40px, body 14px. Telas de diretoria, ficha de entidade, overview.
- **Compact** — linha 36px, input 36px, body 13px. Tabelas operacionais grandes: empresas, cobranças, arrecadação.

O usuário alterna. O padrão de cada tela é decidido por quem a usa mais.

## 6. Forma

```css
--r-xs:3px; --r-sm:5px; --r-md:7px;   /* nunca 16, 20, 24 */
--shadow-sm:0 1px 2px rgba(26,24,21,.05);
```

Hierarquia por **borda, superfície e espaçamento** — não por sombra. Drawer e modal podem ter elevação real; o resto, não.

Espaçamento base 4px: `4 8 12 16 20 24 32 40 48`.

`z-index` nomeado desde já: `base · sticky · dropdown · popover · drawer · modal · command · toast`. Nunca um número literal no componente.

## 7. Cards

Card existe quando há **agrupamento semântico real**. Um dado não vira um card. Cinco métricas não viram cinco cards — viram uma summary bar com divisores.

Transformar tudo em card é a assinatura de interface gerada por template. É proibido.

## 8. Layout

Sem `max-width` centralizado. O Syntex usa a área disponível — é sistema operacional, não site.

```
Sidebar   248px  (compacta 68px)
Topbar    58px
```

Anatomia obrigatória de todo workspace de entidade:

```
breadcrumb → título + status → metadata → ações
summary bar
tabs de contexto
conteúdo
```

## 9. Contratos de componente

O agente **compõe primitives, não inventa**. Todo componente novo nasce como `Syntex*` em `components/ui`, com variants tokenizadas.

```
<SyntexPageHeader />   <SyntexDataTable />   <SyntexMetric />
<SyntexStatus />       <SyntexValidityBand /> <SyntexTimeline />
<SyntexDrawer />       <SyntexCommand />     <SyntexEmptyState />
<SyntexConfirm />      <SyntexField />       <SyntexSensitive />
```

`SyntexValidityBand` e `SyntexStatus` são os dois que carregam a identidade — tratar com cuidado.

## 10. O que o agente NÃO pode fazer

Sem perguntar antes, é proibido:

- inventar cor, radius, sombra, espaçamento ou escala tipográfica fora dos tokens
- criar um novo estilo de card ou de botão
- usar gradiente, ilustração decorativa ou emoji em UI
- adicionar biblioteca visual (ícone, animação, componente) fora da stack
- usar `shadcn add` e ficar com o default — o primitive é base, não produto
- pôr número literal de cor, tamanho ou z-index em componente

Se a tela pede algo que os tokens não cobrem, **pare e pergunte**. É sinal de token faltando ou de tela mal pensada — nunca de exceção justificada.

## 11. Estados obrigatórios

Tela não está pronta sem: **loading (skeleton estrutural, não spinner central) · empty contextual · error · sem permissão · teclado · foco visível**.

Empty state descreve o que apareceria ali e oferece a próxima ação. Sem ilustração fofa.

## 12. Confirmação de ação destrutiva

Nunca "Tem certeza?". A confirmação mostra **o que exatamente vai acontecer**, com os dados concretos, e exige motivo quando a ação entra em auditoria.

```
Cancelar cobrança
Cobrança  #C-84921   ·   Empresa  XPTO Ltda.   ·   Valor  R$ 4.812,00
O cancelamento fica registrado permanentemente na auditoria.
Motivo *  [                    ]
[Voltar]  [Cancelar cobrança]
```

## 13. Linguagem

O texto é design. `"Cobrança criada."` e não `"Processo executado com sucesso."`. `"Não conseguimos registrar o pagamento. Tente novamente."` e não `"Não foi possível realizar a operação solicitada."`

Formatação brasileira — CPF, CNPJ, CEP, telefone, moeda, percentual, data, competência — vive em `lib/formatters`. **Nunca** formatada à mão dentro de um componente.

## 14. Organização

```
apps/web/
  features/<dominio>/   components · queries · actions · schemas · permissions
  components/ui/        primitives Syntex
  components/layout/    shell, sidebar, topbar
  lib/formatters/       CPF, CNPJ, moeda, data, competência
  lib/permissions/      <Can permission="..."> — UI não é fonte de segurança
```

Server Components por padrão. Client apenas onde há interação real: DataTable, filtros, formulário, command palette.

Estado: servidor em TanStack Query · filtro em `searchParams` (URL é estado, para poder compartilhar e salvar view) · UI local em React · formulário em RHF. Store global só com necessidade concreta demonstrada.

## 15. Fora de escopo agora

Nomeado para não voltar como sugestão a cada prompt: Storybook · visual regression / Chromatic · dark mode · PWA · ECharts · virtualização · density switcher na UI (os tokens existem, o controle não) · white label configurável.

Tudo isso é correto e entra depois. Nenhum é pré-requisito da demo.
