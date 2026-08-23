# ADR-019 — platform_notification é control-plane-scoped

- Status: aceita
- Data: 2026-08-23
- Emenda a: CLAUDE.md invariante #1 (escopo de “tabela de tenant”); corrige diagnóstico em ADR-017 §Pendências item 3
- Hardening: migration `0027` (allowlist nominal)

## Contexto

`platform_notification` (migration `0023_platform_ops.sql`) é o inbox do control plane.
Possui `tenant_id uuid references tenant (id)` **nullable**, RLS habilitada sem policies
para `authenticated` (acesso via `service_role` / platform session), e criação com
`tenantId` opcional em `createPlatformNotification` / `POST /api/platform/notifications`.

O helper `test_tenant_tables_missing_unique` tratava **qualquer** tabela com coluna
`tenant_id` como “tabela de tenant”, exigindo `UNIQUE (id, tenant_id)`. Isso falhava
para `platform_notification` — não por ausência de RLS (ADR-017 estava incorreto),
mas porque a semântica da tabela **não é** tenant-owned.

## Decisão

**Estratégia B — platform-scoped (exceção nominal).**

`platform_notification` é **exceção nominal** ao invariante de tabelas de tenant —
**não** uma redefinição geral que permita `tenant_id` nullable em tabelas arbitrárias.

1. `platform_notification` **não** é tabela de tenant.
2. `tenant_id` nela é **referência/filtro contextual opcional**, não chave de ownership:
   - `NULL` = alerta global do control plane;
   - preenchido = contexto (qual sindicato o alerta menciona).
3. Não forçar `tenant_id NOT NULL` nem `UNIQUE (id, tenant_id)` nesta tabela.
4. Regras estruturais (migrations `0026` + `0027`):
   - **Tenant-scoped** = coluna `tenant_id` com `NOT NULL` → exige `UNIQUE (id, tenant_id)`
     e FKs compostas entre tabelas de tenant.
   - **Nullable `tenant_id`** = permitido **somente** se o nome da tabela estiver na
     allowlist SQL `control_plane_nullable_tenant_allowlist()` (hoje:
     `['platform_notification']`). Qualquer outra tabela com `tenant_id` nullable
     falha o structural test até ADR + entrada explícita na allowlist.
5. Segurança: RLS on + sem policy authenticated + gate `getPlatformSession` +
   `createSupabaseAdminClient` nas rotas/UI de `/platform/notificacoes`.

## Consequências

- Suite estrutural verde sem fingir isolamento onde não cabe.
- Exceção **explícita, pequena e testável** — nullable não é escape silencioso.
- Expandir a allowlist exige ADR dedicado (mesmo padrão deste documento).
- ADR-017 item 3 atualizado para a causa real histórica e o estado pós-0026/0027.
