-- Lote 10 — primitivo de delegação + escritório (contador N empresas).
-- Uma só forma: principal A age em nome do sujeito B, com vigência e motivo.
-- office é o contêiner operacional; authorization efetiva = rows em delegation.

-- ---------------------------------------------------------------------------
-- office — escritório contábil / procuradoria no tenant
-- ---------------------------------------------------------------------------
create table office (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  name text not null,
  document text,
  data_classification text not null default 'interno' check (data_classification = 'interno'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, name)
);

create index office_tenant_idx on office (tenant_id);

-- ---------------------------------------------------------------------------
-- office_company_link — quais empresas o escritório opera (agregador)
-- ---------------------------------------------------------------------------
create table office_company_link (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  office_id uuid not null,
  company_id uuid not null,
  reason text not null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  linked_by uuid,
  data_classification text not null default 'interno' check (data_classification = 'interno'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (office_id, tenant_id) references office (id, tenant_id),
  foreign key (company_id, tenant_id) references company (id, tenant_id),
  foreign key (linked_by, tenant_id) references app_user (id, tenant_id),
  check (valid_until is null or valid_until >= valid_from)
);

create unique index office_company_link_active_uidx
  on office_company_link (tenant_id, office_id, company_id)
  where valid_until is null;

create index office_company_link_company_idx
  on office_company_link (tenant_id, company_id);

-- ---------------------------------------------------------------------------
-- delegation — primitivo único (A age por B)
-- subject_kind: company | person | app_user (person/app_user reservados)
-- ---------------------------------------------------------------------------
create table delegation (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  principal_app_user_id uuid not null,
  subject_kind text not null check (subject_kind in ('company', 'person', 'app_user')),
  subject_id uuid not null,
  office_id uuid,
  reason text not null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  granted_by uuid,
  revoked_at timestamptz,
  data_classification text not null default 'interno' check (data_classification = 'interno'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (principal_app_user_id, tenant_id) references app_user (id, tenant_id),
  foreign key (office_id, tenant_id) references office (id, tenant_id),
  foreign key (granted_by, tenant_id) references app_user (id, tenant_id),
  check (valid_until is null or valid_until >= valid_from),
  check (revoked_at is null or valid_until is not null)
);

create unique index delegation_active_uidx
  on delegation (tenant_id, principal_app_user_id, subject_kind, subject_id)
  where revoked_at is null;

create index delegation_principal_idx
  on delegation (tenant_id, principal_app_user_id)
  where revoked_at is null;

create index delegation_subject_idx
  on delegation (tenant_id, subject_kind, subject_id)
  where revoked_at is null;

-- ---------------------------------------------------------------------------
-- Escopo office em user_role / staff_invite
-- ---------------------------------------------------------------------------
alter table user_role
  add column office_id uuid;

alter table user_role
  add constraint user_role_office_id_tenant_id_fkey
  foreign key (office_id, tenant_id) references office (id, tenant_id);

alter table user_role
  drop constraint if exists user_role_scope_check;

alter table user_role
  drop constraint if exists user_role_scope_refs_check;

alter table user_role
  add constraint user_role_scope_check
  check (scope in ('own', 'branch', 'department', 'company', 'office', 'tenant', 'global'));

alter table user_role
  add constraint user_role_scope_refs_check
  check (
    (scope <> 'branch' or branch_id is not null)
    and (scope <> 'department' or department_id is not null)
    and (scope <> 'company' or company_id is not null)
    and (scope <> 'office' or office_id is not null)
  );

alter table staff_invite
  add column office_id uuid;

alter table staff_invite
  add constraint staff_invite_office_id_tenant_id_fkey
  foreign key (office_id, tenant_id) references office (id, tenant_id);

alter table staff_invite
  drop constraint if exists staff_invite_scope_check;

alter table staff_invite
  drop constraint if exists staff_invite_scope_refs_check;

alter table staff_invite
  add constraint staff_invite_scope_check
  check (scope in ('own', 'branch', 'department', 'company', 'office', 'tenant', 'global'));

alter table staff_invite
  add constraint staff_invite_scope_refs_check
  check (
    (scope <> 'branch' or branch_id is not null)
    and (scope <> 'department' or department_id is not null)
    and (scope <> 'company' or company_id is not null)
    and (scope <> 'office' or office_id is not null)
  );

alter table office enable row level security;
alter table office_company_link enable row level security;
alter table delegation enable row level security;

create policy office_isolation on office for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy office_company_link_isolation on office_company_link for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy delegation_isolation on delegation for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

insert into permission (key, description) values
  ('office.provision', 'Criar escritório e office_master'),
  ('office.company.link', 'Vincular empresa ao escritório (gera delegações)'),
  ('office.user.invite', 'Convidar office_user para o escritório')
on conflict (key) do nothing;
