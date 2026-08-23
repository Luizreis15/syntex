-- Slice 0.1 — formaliza platform_notification como entidade do CONTROL PLANE.
--
-- Semântica (código + migration 0023):
--   - Inbox operacional da plataforma, não dado de tenant.
--   - tenant_id é opcional (contexto/filtro), NULL = alerta global do CP.
--   - Acesso só via service_role / platform session (sem policy authenticated).
--
-- Invariante CLAUDE.md #1 ("toda tabela de tenant tem tenant_id NOT NULL
-- + UNIQUE (id, tenant_id)") aplica-se a tabelas de tenant. Detectamos
-- "tabela de tenant" por: coluna tenant_id com attnotnull = true.
-- platform_notification fica fora por construção (tenant_id nullable).

comment on table platform_notification is
  'Alertas do control plane (não é tabela de tenant). tenant_id NULL = global; '
  'tenant_id preenchido = contexto opcional. Leitura/escrita via service_role '
  '(platform session). Exceção explícita ao UNIQUE (id, tenant_id) — ver ADR-019.';

comment on column platform_notification.tenant_id is
  'Opcional. Referência contextual a um tenant; NULL = notificação global do control plane.';

-- Helpers estruturais: só tabelas com tenant_id NOT NULL são "tabelas de tenant".
create or replace function test_tenant_tables_missing_unique()
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
        and a.attnotnull
    )
    and not exists (
      select 1
      from pg_constraint con
      where con.conrelid = c.oid
        and con.contype = 'u'
        and (
          select array_agg(attname order by attname)
          from pg_attribute
          where attrelid = c.oid and attnum = any (con.conkey)
        ) @> array['id', 'tenant_id']::name[]
    );
$$;

create or replace function test_tenant_fks_not_composite()
returns table (table_name text, constraint_name text)
language sql
security definer
set search_path = public
as $$
  select c.relname::text, con.conname::text
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and con.contype = 'f'
    and exists (
      select 1 from pg_attribute a
      where a.attrelid = c.oid
        and a.attname = 'tenant_id'
        and not a.attisdropped
        and a.attnotnull
    )
    and exists (
      select 1 from pg_attribute a
      where a.attrelid = con.confrelid and a.attname = 'tenant_id' and not a.attisdropped
    )
    and array_length(con.conkey, 1) < 2;
$$;

-- Assert explícito da exceção ADR-019 (nullable tenant_id + RLS).
create or replace function test_platform_notification_is_control_plane_scoped()
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    exists (
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
