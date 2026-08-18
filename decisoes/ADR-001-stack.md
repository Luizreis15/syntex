# ADR-001 — Stack

- Status: aceita
- Data: 2026-08-18

## Contexto

Precisamos de uma stack que suporte multi-tenancy com RLS, vigência temporal com constraints `EXCLUDE`, e autorização rica em app-layer, sem depender de gerador de migration de ORM (que tende a não expressar bem RLS, policies e `EXCLUDE USING gist`).

## Decisão

- **Web:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + React Hook Form + Zod.
- **Dados:** Supabase / PostgreSQL — RLS, Storage, Auth.
- **Migrations:** SQL puro via Supabase CLI, versionadas em `supabase/migrations/`. Sem gerador de ORM.
- **Tipos:** gerados do schema real (`supabase gen types typescript --linked`), não escritos à mão.
- **Testes:** Vitest (unit/integração, contra o banco de DEV) e Playwright (e2e).
- **Monorepo:** `npm` workspaces (sem pnpm/Turborepo — nenhum dos dois estava no ambiente e não há necessidade de cache de build distribuído nesta fatia; reavaliar quando houver `apps/worker`).
- **Auth cliente Supabase:** `@supabase/ssr` para sincronizar sessão entre Server Components, Route Handlers e middleware via cookies.

## Consequências

- Toda mudança de schema é uma migration SQL revisável em PR, não uma migration gerada e reescrita por um ORM.
- Composite FKs, `EXCLUDE USING gist` e RLS policies são escritos à mão — mais verboso, mas correto e auditável.
- PostgREST (usado pelo cliente Supabase) não infere automaticamente relacionamentos de *embedding* quando a FK é composta: é preciso referenciar o nome da constraint explicitamente no `select` (ex.: `role:user_role_role_id_tenant_id_fkey(name)`). Isso foi descoberto na prática (loop de redirect no login causado por uma query de embedding que falhava silenciosamente no client, mas retornava erro explícito quando testada isoladamente) e vale registrar como armadilha conhecida da stack: sempre que uma FK entre tabelas de tenant é composta (invariante do CLAUDE.md #1), qualquer `select` que a use como embedding precisa do nome da constraint.
