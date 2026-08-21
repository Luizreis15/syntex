-- Lote 7 — platform_admin (control plane) + escopo company + masters.

-- Control plane: sem tenant_id. Autorização na app após checar esta tabela.
create table platform_admin (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id),
  email text not null unique,
  full_name text not null,
  created_at timestamptz not null default now()
);

alter table platform_admin enable row level security;
-- Sem policy de SELECT para anon/authenticated: leitura só via service_role
-- (requirePlatformAdmin). Evita enumeração de admins da plataforma.

-- Escopo company: vínculo do user_role / convite a uma empresa do tenant.
alter table user_role
  add column company_id uuid;

alter table user_role
  add constraint user_role_company_id_tenant_id_fkey
  foreign key (company_id, tenant_id) references company (id, tenant_id);

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.user_role'::regclass
    and contype = 'c'
    and conname = 'user_role_scope_refs_check'
  limit 1;
  if cname is not null then
    execute format('alter table user_role drop constraint %I', cname);
  end if;
end $$;

alter table user_role
  drop constraint if exists user_role_scope_check;

-- Recria check de escopo incluindo company.
alter table user_role
  drop constraint if exists user_role_scope_refs_check;

alter table user_role
  add constraint user_role_scope_check
  check (scope in ('own', 'branch', 'department', 'company', 'tenant', 'global'));

alter table user_role
  add constraint user_role_scope_refs_check
  check (
    (scope <> 'branch' or branch_id is not null)
    and (scope <> 'department' or department_id is not null)
    and (scope <> 'company' or company_id is not null)
  );

alter table staff_invite
  add column company_id uuid;

alter table staff_invite
  add constraint staff_invite_company_id_tenant_id_fkey
  foreign key (company_id, tenant_id) references company (id, tenant_id);

alter table staff_invite
  drop constraint if exists staff_invite_scope_check;

alter table staff_invite
  drop constraint if exists staff_invite_scope_refs_check;

alter table staff_invite
  add constraint staff_invite_scope_check
  check (scope in ('own', 'branch', 'department', 'company', 'tenant', 'global'));

alter table staff_invite
  add constraint staff_invite_scope_refs_check
  check (
    (scope <> 'branch' or branch_id is not null)
    and (scope <> 'department' or department_id is not null)
    and (scope <> 'company' or company_id is not null)
  );

insert into permission (key, description) values
  ('platform.tenant.read', 'Listar tenants na plataforma'),
  ('platform.tenant.provision', 'Provisionar tenant + union master'),
  ('company.master.provision', 'Criar empresa com company_master')
on conflict (key) do nothing;

-- Convites provisionados pela plataforma não têm app_user convidador no tenant.
alter table staff_invite
  alter column invited_by drop not null;
