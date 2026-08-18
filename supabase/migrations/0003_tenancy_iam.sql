-- Tenancy e IAM. Ver CLAUDE.md #1 (isolamento) e #2 (autorização).
--
-- RLS aqui carrega só isolamento de tenant. A árvore role -> permission ->
-- scope é avaliada na aplicação (packages/permissions), tipada e testável;
-- estas tabelas apenas armazenam a matriz configurada por tenant.

create table tenant (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legal_name text not null,
  cnpj text not null unique,
  created_at timestamptz not null default now()
);

create table branch (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  name text not null,
  municipality_id uuid references municipality (id),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, name)
);

-- app_user espelha auth.users do Supabase Auth, com o tenant a que pertence.
-- Um mesmo auth.users pode ter uma linha por tenant (constraint composta),
-- mas nesta fatia cada pessoa pertence a um único tenant.
create table app_user (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  auth_user_id uuid not null references auth.users (id),
  full_name text not null,
  email text not null,
  data_classification text not null default 'pessoal' check (data_classification = 'pessoal'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, auth_user_id)
);

-- Catálogo global de permissões. Não é configuração por tenant: as chaves
-- (ex.: 'company.read') são o contrato entre o schema e
-- packages/permissions — mudam com deploy de código, não com dado.
create table permission (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null
);

create table role (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  name text not null,
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, name)
);

create table role_permission (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  role_id uuid not null,
  permission_id uuid not null references permission (id),
  unique (id, tenant_id),
  unique (tenant_id, role_id, permission_id),
  foreign key (role_id, tenant_id) references role (id, tenant_id)
);

create table user_role (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  app_user_id uuid not null,
  role_id uuid not null,
  scope text not null check (scope in ('own', 'branch', 'department', 'tenant', 'global')),
  branch_id uuid,
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (app_user_id, tenant_id) references app_user (id, tenant_id),
  foreign key (role_id, tenant_id) references role (id, tenant_id),
  foreign key (branch_id, tenant_id) references branch (id, tenant_id),
  check (scope <> 'branch' or branch_id is not null)
);

-- Função de apoio para as policies de RLS: os tenants a que o usuário
-- autenticado pertence. SECURITY DEFINER porque app_user tem RLS própria
-- e a policy de cada tabela de tenant precisa consultar isto sem recursão.
create or replace function app_current_tenant_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from app_user where auth_user_id = auth.uid();
$$;

alter table tenant enable row level security;
alter table branch enable row level security;
alter table app_user enable row level security;
alter table permission enable row level security;
alter table role enable row level security;
alter table role_permission enable row level security;
alter table user_role enable row level security;

-- tenant: um usuário só vê a linha do próprio tenant (nunca a lista inteira).
create policy tenant_isolation on tenant for select
  using (id in (select app_current_tenant_ids()));

create policy branch_isolation on branch for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy app_user_isolation on app_user for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy permission_read_all on permission for select using (true);

create policy role_isolation on role for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy role_permission_isolation on role_permission for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy user_role_isolation on user_role for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));
