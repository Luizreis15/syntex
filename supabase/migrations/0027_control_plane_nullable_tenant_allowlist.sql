-- Slice 0.1 hardening — exceções control-plane com tenant_id nullable
-- devem ser NOMINAIS (allowlist), não implícitas via "qualquer nullable".
--
-- Regras:
--   1. Tabela com tenant_id NOT NULL = tenant-scoped → UNIQUE (id, tenant_id).
--   2. Tabela com tenant_id nullable = só se estiver na allowlist explícita.
--   3. Allowlist atual: apenas platform_notification (ADR-019).
-- Nova tabela nullable exige ADR + entrada na allowlist; senão o structural falha.

create or replace function control_plane_nullable_tenant_allowlist()
returns text[]
language sql
immutable
as $$
  select array['platform_notification']::text[];
$$;

comment on function control_plane_nullable_tenant_allowlist() is
  'Tabelas com tenant_id nullable deliberadamente control-plane-scoped. '
  'Expandir só com ADR. Ver ADR-019.';

-- Qualquer tenant_id nullable fora da allowlist é falha estrutural.
create or replace function test_nullable_tenant_id_outside_allowlist()
returns table (table_name text)
language sql
security definer
set search_path = public
as $$
  select c.relname::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and exists (
      select 1 from pg_attribute a
      where a.attrelid = c.oid
        and a.attname = 'tenant_id'
        and not a.attisdropped
        and not a.attnotnull
    )
    and not (c.relname::text = any (control_plane_nullable_tenant_allowlist()));
$$;

-- platform_notification: nullable + RLS + na allowlist (exceção nominal).
create or replace function test_platform_notification_is_control_plane_scoped()
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    'platform_notification' = any (control_plane_nullable_tenant_allowlist())
    and exists (
      select 1
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'platform_notification'
        and a.attname = 'tenant_id'
        and not a.attisdropped
        and not a.attnotnull
    )
    and exists (
      select 1
      from pg_tables
      where schemaname = 'public'
        and tablename = 'platform_notification'
        and rowsecurity
    );
$$;

-- tenant-scoped (tenant_id NOT NULL) continua exigindo UNIQUE — inalterado vs 0026.
-- (funções test_tenant_tables_missing_unique / test_tenant_fks_not_composite
--  permanecem as de 0026; não recriadas aqui.)
