-- Lote 4 — Core de pessoas: person, worker, employment_relationship, membership.
-- Filiação sindical (membership) é dado sensível LGPD — tabela própria, nunca
-- coluna em person. Ver CLAUDE.md #5 e fundacao/01 §8–11.

-- ---------------------------------------------------------------------------
-- person — identidade no tenant (independente de papel)
-- ---------------------------------------------------------------------------
create table person (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  cpf text not null,
  full_name text not null,
  social_name text,
  birth_date date,
  email text,
  phone text,
  municipality_id uuid references municipality (id),
  data_classification text not null default 'pessoal' check (data_classification = 'pessoal'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, cpf),
  check (cpf ~ '^\d{11}$')
);

create index person_tenant_name_idx on person (tenant_id, full_name);
create index person_tenant_cpf_idx on person (tenant_id, cpf);

-- ---------------------------------------------------------------------------
-- worker — papel de trabalhador da base (1:1 com person no tenant)
-- ---------------------------------------------------------------------------
create table worker (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  person_id uuid not null,
  branch_id uuid,
  registration_number text,
  data_classification text not null default 'pessoal' check (data_classification = 'pessoal'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, person_id),
  foreign key (person_id, tenant_id) references person (id, tenant_id),
  foreign key (branch_id, tenant_id) references branch (id, tenant_id)
);

create index worker_tenant_branch_idx on worker (tenant_id, branch_id);

-- ---------------------------------------------------------------------------
-- employment_relationship — vínculo temporal trabalhador × empresa
-- ---------------------------------------------------------------------------
create table employment_relationship (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  worker_id uuid not null,
  company_id uuid not null,
  establishment_id uuid,
  valid_from date not null,
  valid_until date,
  job_title text,
  status text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  source text not null default 'manual' check (source in ('manual', 'import', 'empresa')),
  data_classification text not null default 'pessoal' check (data_classification = 'pessoal'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (worker_id, tenant_id) references worker (id, tenant_id),
  foreign key (company_id, tenant_id) references company (id, tenant_id),
  foreign key (establishment_id, tenant_id) references establishment (id, tenant_id),
  check (valid_until is null or valid_until >= valid_from),
  check (status <> 'encerrado' or valid_until is not null),
  -- Sem sobreposição do mesmo trabalhador na mesma empresa
  exclude using gist (
    worker_id with =,
    company_id with =,
    daterange(valid_from, coalesce(valid_until, 'infinity'::date), '[]') with &&
  )
);

create index employment_worker_idx on employment_relationship (tenant_id, worker_id, valid_from desc);
create index employment_company_idx on employment_relationship (tenant_id, company_id);

-- ---------------------------------------------------------------------------
-- membership — filiação sindical (SENSÍVEL). Histórico temporal de status.
-- ---------------------------------------------------------------------------
create table membership (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  person_id uuid not null,
  status text not null check (
    status in ('prospect', 'ativo', 'suspenso', 'inadimplente', 'cancelado', 'desfiliado', 'falecido')
  ),
  valid_from date not null,
  valid_until date,
  category text,
  contribution_form text,
  data_classification text not null default 'sensivel' check (data_classification = 'sensivel'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (person_id, tenant_id) references person (id, tenant_id),
  check (valid_until is null or valid_until >= valid_from),
  -- Uma pessoa, um status vigente por vez (histórico sem sobreposição)
  exclude using gist (
    person_id with =,
    daterange(valid_from, coalesce(valid_until, 'infinity'::date), '[]') with &&
  )
);

create index membership_person_idx on membership (tenant_id, person_id, valid_from desc);
create index membership_status_idx on membership (tenant_id, status) where valid_until is null;

-- ---------------------------------------------------------------------------
-- Outbox
-- ---------------------------------------------------------------------------
create trigger person_created_outbox
  after insert on person
  for each row execute function emit_outbox_event('person');

create trigger worker_created_outbox
  after insert on worker
  for each row execute function emit_outbox_event('worker');

create trigger membership_created_outbox
  after insert on membership
  for each row execute function emit_outbox_event('membership');

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table person enable row level security;
alter table worker enable row level security;
alter table employment_relationship enable row level security;
alter table membership enable row level security;

create policy person_isolation on person for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy worker_isolation on worker for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy employment_relationship_isolation on employment_relationship for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy membership_isolation on membership for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));
