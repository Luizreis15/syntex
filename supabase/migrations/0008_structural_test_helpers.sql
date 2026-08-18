-- Funções de introspecção usadas pelos testes estruturais (DoD do CLAUDE.md
-- #1): varrem o catálogo do Postgres, não uma lista mantida à mão, para que
-- uma tabela nova sem RLS/UNIQUE/FK composta quebre o teste automaticamente.

create or replace function test_tables_missing_rls()
returns table (table_name text)
language sql
security definer
set search_path = public
as $$
  select tablename::text
  from pg_tables
  where schemaname = 'public' and not rowsecurity;
$$;

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
      where a.attrelid = c.oid and a.attname = 'tenant_id' and not a.attisdropped
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
      where a.attrelid = c.oid and a.attname = 'tenant_id' and not a.attisdropped
    )
    and exists (
      select 1 from pg_attribute a
      where a.attrelid = con.confrelid and a.attname = 'tenant_id' and not a.attisdropped
    )
    and array_length(con.conkey, 1) < 2;
$$;
