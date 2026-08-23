# ADR-018 — Modo A: front DEMO Lovable-like com mocks

## Status

Aceito (2026-08-23)

## Contexto

A referência Lovable entregou densidade visual superior ao Command Center / 360
construídos sob a lei visual rígida + freeze + proibição de mock. A fundação de
domínio foi arquivada em `_arquivo_fundacao/` sem exclusão.

## Decisão

Ativar **Modo A**: priorizar front premium próximo ao Lovable, permitindo mocks
de UI no Painel e telas 360, mantendo invariantes de backend (tenant, RLS, auth).

Artefatos arquivados (não deletados):

- `_arquivo_design/SYNTEX-UI-v2.1.md`
- `_arquivo_design/syntex-visual-v2-shell-freeze.mdc`

Regra Cursor ativa: `.cursor/rules/syntex-frontend-demo-lovable.mdc`

## Consequências

- Shell e dashboard podem ser redesenhados sem unfreeze
- Mock deve ser rotulado e isolado para substituição posterior
- Fase seguinte religa queries reais e pode restaurar a lei visual
