-- Lote 6 — department (setor) + convite interno de staff.
-- Escopo `department` em user_role passa a ser implementável (ADR-008 / doc 03).

create table department (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  branch_id uuid,
  name text not null,
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, name),
  foreign key (branch_id, tenant_id) references branch (id, tenant_id)
);

alter table user_role
  add column department_id uuid;

alter table user_role
  add constraint user_role_department_id_tenant_id_fkey
  foreign key (department_id, tenant_id) references department (id, tenant_id);

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.user_role'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%branch_id%'
  limit 1;
  if cname is not null then
    execute format('alter table user_role drop constraint %I', cname);
  end if;
end $$;

alter table user_role
  add constraint user_role_scope_refs_check
  check (
    (scope <> 'branch' or branch_id is not null)
    and (scope <> 'department' or department_id is not null)
  );

-- Convite interno: e-mail + role + escopo, aceito via token (hash).
create table staff_invite (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  email text not null,
  role_name text not null,
  scope text not null check (scope in ('own', 'branch', 'department', 'tenant', 'global')),
  branch_id uuid,
  department_id uuid,
  invited_by uuid not null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  data_classification text not null default 'pessoal' check (data_classification = 'pessoal'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (branch_id, tenant_id) references branch (id, tenant_id),
  foreign key (department_id, tenant_id) references department (id, tenant_id),
  foreign key (invited_by, tenant_id) references app_user (id, tenant_id),
  check (scope <> 'branch' or branch_id is not null),
  check (scope <> 'department' or department_id is not null),
  check (accepted_at is null or revoked_at is null)
);

create index staff_invite_tenant_email_idx on staff_invite (tenant_id, email)
  where accepted_at is null and revoked_at is null;

alter table department enable row level security;
alter table staff_invite enable row level security;

create policy department_isolation on department for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy staff_invite_isolation on staff_invite for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

insert into permission (key, description) values
  ('staff.read', 'Listar equipe, departamentos e convites internos'),
  ('staff.invite', 'Convidar usuários internos do sindicato')
on conflict (key) do nothing;
