# ADR-020 — Fase operacional e frontend baseline congelado

- Status: **aceita** (norma vigente **sobre fase visual, Modo A, frontend freeze,
  redesign global e prioridade operacional** — não sobre todo o ADR corpus)
- Data: 2026-08-23
- Emenda / precede **nesses temas**: ADR-017 (freeze shell/dashboard), ADR-018 (Modo A)
- Relaciona: `docs/FRONTEND-APPROVED-BASELINE.md`, `docs/OPERATIONAL-BASELINE.md`

## Contexto

ADR-017 congelou shell e Command Center sob Visual System v2.  
ADR-018 (Modo A) **suspendeu** temporariamente esse freeze para alcançar densidade
visual Lovable, autorizando mocks de UI no Painel / 360.

O objetivo visual foi alcançado e aprovado pelo Product Owner:

- código: `d31dcc1`
- freeze documental: `3409cdc` (`docs/FRONTEND-APPROVED-BASELINE.md`)

Sem ADR novo, agentes leriam 017 e 018 em conflito.

## Decisão

1. **ADR-018 foi exceção temporária** para o Modo A (redesign + DEMO UI).
2. O **objetivo visual foi alcançado**.
3. O **Modo A de redesign global está encerrado**.
4. O frontend premium atual é **novamente baseline congelado**
   (shell, topbar, sidebar, tokens, login, painel, listagens, 360s).
5. **Novos módulos** devem reutilizar Visual System e patterns existentes —
   não inventar linguagem paralela.
6. **Mudança global** em shell/design exige **aprovação explícita do PO**.
7. Blocos **DEV_DEMO** existentes podem permanecer **somente** onde já
   identificados (Painel / Empresa 360 / Trabalhador 360 / brand login DEV).
8. **Não criar novos DEMOs silenciosos** em capabilities operacionais.
9. A prioridade passa a ser **operação real** e **vertical slices**
   (`docs/OPERATIONAL-BASELINE.md`).
10. **ADR-020 é a regra mais recente** nos temas abaixo. Em conflito com
    ADR-017/018 **somente nesses temas**, prevalece ADR-020:
    - fase visual / Modo A;
    - frontend freeze;
    - redesign global;
    - prioridade operacional pós-aprovação do PO.

    **Não** revoga indiscriminadamente outras decisões técnicas dos ADRs
    anteriores (nav `built:false`, temporalidade, etc.).

ADR-017 e ADR-018 **permanecem no histórico**; não apagar.

## Consequências

- Regra Cursor / CLAUDE.md apontam para fase operacional, não Modo A ativo.
- Slice 0.1+ não tocam UI premium incidentalmente.
- Próximo domínio de produto: Representação sindical (ver baseline).
- Substituição de DEV_DEMO → REAL é slice próprio, módulo a módulo.

## Não-decisões (explícitas)

- Não remove nav `built:false` neste ADR (pendência ADR-017 / Slice 0.3+).
- Não remove placeholder `/filiacao` neste ADR (Slice 0.3).
- Não reativa austeridade visual do `_arquivo_design/` como lei — o baseline
  **é o código aprovado**, não o doc arquivado.
