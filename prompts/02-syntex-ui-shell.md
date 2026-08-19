# Prompt 02 — Syntex UI: tokens, primitives, shell e DataTable

> Cole no Claude Code na pasta `Syntex/`. Ele lê `CLAUDE.md` automaticamente.

---

Leia **`design/SYNTEX-UI.md`** inteiro antes de escrever qualquer linha. Ele é a lei do front-end e o teste de aceitação verifica cada regra dele.

Contexto: a fatia 1 entregou o Union Domain funcionando com 2 telas cruas em shadcn padrão. Agora vamos construir a linguagem visual do produto e reconstruir essas telas sobre ela. **Temos demonstração para um cliente em 14 dias.**

## Objetivo

Estabelecer o Syntex UI e entregar o shell completo mais a lista de empresas em qualidade de demonstração.

## Não faz parte deste prompt

Empresa 360, tela de Representação, dashboard, Storybook, dark mode, PWA, density switcher na interface, white label, gráficos. A tela de detalhe atual pode continuar crua — ela é o prompt 03.

Não construa primitive que nenhuma das telas deste prompt use. Biblioteca de componentes se extrai de uso, não se inventa antes.

---

## Entregáveis

### 1. Tokens

`app/globals.css` com todos os valores de `SYNTEX-UI.md` como variáveis CSS, e `tailwind.config.ts` lendo delas. Fontes via `next/font`: Inter, Source Serif 4, IBM Plex Mono — self-hosted, sem link externo.

Tokens de densidade (`comfortable` / `compact`) existem como variáveis desde já, com `comfortable` ativo. O controle na UI fica para depois.

`z-index` nomeado em token. Nenhum número literal de cor, raio, espaçamento ou z-index em componente — isso é verificado por teste.

### 2. Primitives `Syntex*`

Só os que este prompt usa:

`SyntexPageHeader` · `SyntexStatus` · `SyntexDataTable` · `SyntexField` · `SyntexEmptyState` · `SyntexCommand` · `SyntexValidityBand`

Notas sobre os dois que carregam a identidade:

**`SyntexStatus`** recebe um estado de domínio (`reconhecida` | `reivindicada` | `disputada` | `perdida`) ou de sistema (`success` | `warning` | `danger` | `info`) — **e os dois conjuntos não se misturam nem compartilham cor por acidente**. Sempre renderiza cor + ícone + texto, nunca só cor.

**`SyntexValidityBand`** recebe uma lista de períodos com estado e uma data de referência, e desenha a faixa com o marcador na data. É o componente mais próprio do produto. Neste prompt ele aparece só na coluna de vigência da tabela, em versão reduzida — a versão completa vem no prompt 03. Projete a API pensando nos dois usos.

### 3. Shell

Sidebar 248px em `--shell-950`, com tenant switcher, branch switcher e navegação por seções. **Módulo sem permissão não aparece** — não renderize desabilitado, omita. Topbar 58px com breadcrumb, busca global, criar, notificações e perfil.

Command palette em `⌘K`, com busca real em empresas e estabelecimentos, agrupada por tipo, **respeitando permissão e escopo**. Ela não pode retornar nada que o usuário não poderia abrir pela navegação.

### 4. Lista de empresas

`SyntexDataTable` sobre TanStack Table, com: busca por CNPJ e razão social, filtro por município e por estado de representação, ordenação, seleção de linha, visibilidade de coluna, paginação server-side, e **filtros refletidos na URL** (`?municipio=maua&status=disputada`).

Coluna de representação usa `SyntexStatus`. Coluna de vigência usa a versão reduzida de `SyntexValidityBand`.

### 5. Reconstruir o login

Sobre os tokens novos. Simples e sóbrio, sem card centralizado genérico.

### 6. Seed de demonstração

Substituir o seed atual por dados que um diretor do ABC reconheça: empresas com razão social plausível de comércio da região, CNPJs válidos no dígito verificador, as cinco unidades reais, CNAEs de comércio, uma CCT com número de Mediador no formato correto.

**Mínimo 40 empresas** distribuídas entre reconhecida, reivindicada, disputada e perdida, com histórico de vigência que faça sentido temporal. Tabela com 3 linhas não demonstra nada — a densidade é parte do argumento de venda.

Dado fictício deve ser plausível, nunca real. Se inventar CNPJ, garanta que o DV fecha.

---

## Definition of Done

Além dos testes que já existem e continuam passando:

**Conformidade com os tokens**
- Teste que varre `components/` e `features/` e falha ao encontrar cor hex, `z-index` numérico, `border-radius` ou espaçamento literal fora dos tokens
- Nenhum componente `shadcn` em uso com estilo default

**Comportamento**
- Command palette não retorna entidade fora do escopo do usuário — teste com dois tenants e com usuário limitado a uma unidade
- Filtro da tabela sobrevive a recarregar a página e a compartilhar a URL
- Navegação completa por teclado no shell e na tabela; foco sempre visível
- Todo estado renderiza: loading em skeleton estrutural, empty contextual, error, e sem-permissão

**Acessibilidade**
- Contraste mínimo 4.5:1 em todo texto, verificado automaticamente nos tokens
- Nenhum estado comunicado só por cor

**Visual**
- Playwright captura screenshot de shell, lista e login para revisão

---

## Onde parar e perguntar

- Se uma tela pedir algo que os tokens não cobrem. Isso é token faltando ou tela mal pensada — nunca exceção justificada.
- Antes de qualquer dependência nova, inclusive de ícone ou animação.
- Se a API do `SyntexValidityBand` ficar ambígua entre o uso reduzido e o completo. Traga a proposta antes de implementar.

## Ordem

Tokens → primitives → shell → tabela → login → seed. Não avance para a tabela antes de o shell estar conforme: ele define a moldura que todas as telas seguintes herdam.

Comece confirmando o que entendeu e qual será o primeiro commit.
