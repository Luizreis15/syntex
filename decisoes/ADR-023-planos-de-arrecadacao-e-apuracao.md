# ADR-023 — Planos de arrecadação e apuração por competência

**Status:** aceito pelo Product Owner em 30/08/2026  
**Revisão:** pacote 1a+1b+2 no mesmo dia (antes de aplicar 0030)

**Contexto:** o fluxo anterior gerava obrigação a partir de uma regra simples e uma base monetária livre, sem representar quantidade de trabalhadores, piso, folha declarada ou papel da empresa no repasse.

## Decisão

1. **`revenue_plan`** é o cabeçalho do plano (fundamento, sujeito, recolhimento, público, periodicidade, vigência). V1: **1 plano → 1 `contribution_rule`** (átomo de cálculo). Faixas/parcelas ficam para slices posteriores.
2. **`contribution_rule`** permanece o vínculo de obrigação/CCT resolution; ganha `revenue_plan_id` e `calculation_method`.
3. **CCT condicional (1b):** `source_type = collective_agreement` ⇒ acordo obrigatório; demais fontes ⇒ acordo proibido. `mensalidade` não usa CCT (`statute` / `assembly` / `individual_authorization`).
4. Métodos iniciais: piso × headcount × %; folha × %; fixo por trabalhador; fixo por empresa.
5. **`contribution_assessment`:** memória imutável da competência; `company_id` = empresa de **contexto** da apuração (não o devedor automático).
6. **`obligation` distingue:** `debtor_kind` + `debtor_company_id` / `debtor_person_id` (devedor) × `remitting_company_id` (repassadora). `company_id` legado = contexto.
7. A obrigação continua imutável e pode apontar para a apuração (`assessment_id`).

## Consequências

- Geração de cobrança deixa de aceitar “base R$” sem contexto quando o caminho for apuração.
- Planos sem CCT são permitidos e **impedidos** de carregar CCT fantasma.
- Corrigir devedor × repassadora **antes** de acumular obrigação em produção.
- Faixas, parcelas, oposição individual e negociação de débitos: slices posteriores.
