# ADR-017 — Navegação: mapa do produto com itens ainda não construídos

- Status: aceita
- Data: 2026-08-22
- Emenda a: ADR-013 (consequência “sidebar só mostra o que existe”)

## Contexto

A referência visual aprovada (`syntex-vital-core`) define sete grupos de menu e um mapa completo do produto (Relações, Operação, Financeiro, Engajamento, Inteligência, Administração). A maior parte desses itens ainda não tem módulo, rota ou permissão no Syntex.

ADR-013 estabeleceu que a navegação mostra só o que existe — em reação a menus-fantasma cosméticos de demo. Isso conflita com a necessidade de **comunicar o mapa do produto** na chrome, sem abrir telas vazias nem enfraquecer autorização.

## Decisão

1. A estrutura de sete grupos da referência é a navegação oficial do painel do sindicato.
2. Cada item tem discriminante:
   - `built: true` + `href` + `permission` — some da UI se `can(...)` falhar.
   - `built: false` — aparece para todos os usuários autenticados do shell sindicato, **sem link**, visualmente inerte (`aria-disabled`), sem rota.
3. Existência visual **não** concede acesso. Autorização continua em app-layer + RLS.
4. Rotas reais que não estão na lista visual da referência (ex.: Escritórios, ADR-015) podem permanecer no grupo Administração para não regredir funcionalidade; documentar no `nav-config`.
5. Ícones atravessam Server → Client como `NavIconKey` (string); o componente Lucide é resolvido só no client (`NAV_ICON`).

Isto **emenda** a consequência de ADR-013 sobre “sem menu-fantasma”: fantasma cosmético de demo continua proibido; mapa de produto inerte e permission-aware é permitido.

## Consequências

- Shell comunica o produto completo sem fingir módulo pronto.
- Novos módulos ligam `built: false` → `true` + rota + permission — sem redesign de nav.
- Testes de permissão continuam a esconder itens `built: true` sem grant.
- Não usar isto para seed cosmético ou placeholders clicáveis.

## Pendências (pós Fase 1 — App Shell v2)

1. **Itens `built: false` em produção** — hoje permanecem visíveis (inertes) para comunicar o mapa do produto. Podem ficar visíveis **apenas em desenvolvimento**; em produção devem ser ocultados ou condicionados explicitamente a feature/module availability. Sem isso, a chrome de produção promete módulos que não existem.
2. **Temporalidade após remoção do `SyntexAsOfBar`** — a remoção da barra full-width não elimina o conceito de domínio “vigente em”. **Competência** (mês/ano, pill na topbar, `?competencia=`) e **data de vigência** (as-of de entidades temporais) são conceitos distintos. O padrão de composição será redefinido nas telas temporais (Fases seguintes), não no shell.
3. **P0 segurança (fora da migração visual)** — falha pré-existente: tabela `platform_notification` sem RLS (teste `structural.test.ts`). Tratar como pendência de segurança separada; não misturar com o trabalho de Visual System v2.

## Congelamento do Shell (aprovado)

Commit de referência em `origin/main`: **`9aeff69`**.

O App Shell v2 (sidebar/7 grupos, topbar, command, competência, unidade, perfil, tokens, tipografia, iconografia Lucide, nav permission-aware) está **congelado**. Fases seguintes (a partir do Dashboard) não alteram esses artefatos incidentalmente. Se for necessário tocar no shell ou em tokens globais, o agente **para, justifica e espera aprovação**. Regra espelhada em `.cursor/rules/syntex-visual-v2-shell-freeze.mdc`.
