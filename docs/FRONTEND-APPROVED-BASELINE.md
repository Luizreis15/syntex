# Syntex — Frontend Approved Baseline

**Status:** aprovado pelo Product Owner · **congelado na fase operacional (ADR-020)**  
**Branch de origem:** `frontend-lockdown-v21`  
**Data:** 2026-08-23  
**Código de referência:** `d31dcc1`  
**Freeze documental:** `3409cdc`

## Escopo congelado

- Visual System v2.1 (tokens, `globals.css`, Tailwind)
- App Shell atual (sidebar/topbar/nav ADR-017)
- Login split-pane (P4.1)
- Painel / Command Center (inclui DEV_DEMO rotulado)
- Listagens Empresas e Trabalhadores
- Empresa 360 e Trabalhador 360 (seed REAL + DEV_DEMO rotulado)
- Primitives: SyntexMetric, SyntexPanel, SyntexProgress, SyntexAccentRail, DataTable/Field

## Regra (ADR-020)

- Não redesenhar estas superfícies em slices operacionais sem aprovação do PO.
- Novos módulos reutilizam patterns existentes.
- Não criar novos DEV_DEMO silenciosos.
- Mapa operacional: `docs/OPERATIONAL-BASELINE.md`.

## Fora deste baseline

- Auditoria: `docs/audits/OPERABILITY-MAP-CURSOR-2026-08-23.md` (não canônica)
- Screenshots / scripts e2e de debug
- Domínio/backend (evoluem em `operational-core-v1`)
