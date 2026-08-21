# ADR-015 — Primitivo único de delegação (IAM)

## Status

Aceito (Lote 10).

## Contexto

Contador/procurador (N empresas), representante de associado e impersonation de suporte são o **mesmo** fenômeno: principal A age em nome do sujeito B, com escopo, vigência, motivo e auditoria (fundacao/03). Modelar três vezes gera bug de autorização na terceira.

## Decisão

1. **Tabela `delegation`** é a fonte de verdade da autorização delegada:
   - `principal_app_user_id` (A)
   - `subject_kind` + `subject_id` (B: `company` | `person` | `app_user`)
   - `valid_from` / `valid_until` / `revoked_at`
   - `reason` obrigatório
   - `office_id` opcional (proveniência quando o vínculo veio de um escritório)

2. **`office` + `office_company_link`** são o contêiner operacional do contador — não um segundo modelo de auth. Vincular empresa materializa `delegation` para cada membro do escritório; convidar membro materializa `delegation` para cada empresa já linkada.

3. **Roles** `office_master` / `office_user` com escopo `office` + `office_id` em `user_role`. Na sessão, delegações ativas de `subject_kind = company` expandem grants sintéticos `scope=company` para `can()` / `allowedCompanyIds` reutilizarem o portal financeiro.

4. **Fora deste ADR (mesmo primitivo, fatias futuras):** delegação `person` (terceiro no associado) e `app_user` (impersonation de suporte). A tabela já aceita o `subject_kind`; a UI e as regras de emissão entram depois.

## Consequências

- Autorização rica continua na app; RLS só isola tenant.
- Desvincular empresa = fechar link + revogar delegações (`revoked_at` + `valid_until`).
- Não criar tabelas `company_representative` / `support_impersonation` separadas.
