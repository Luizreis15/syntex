-- Empresa e estabelecimento. Cada tenant mantém seu próprio cadastro de
-- empresas com as quais se relaciona — não é um registro global de CNPJs.
--
-- branch_id em company é a unidade do sindicato responsável pelo
-- relacionamento (usada pelo escopo 'branch' da autorização, ex.: usuário de
-- Mauá não lê empresa atribuída a Santo André).
--
-- Matriz e filial podem divergir de município/CNAE, e portanto de
-- representação — por isso a resolução acontece no nível do estabelecimento.

create table company (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  branch_id uuid,
  cnpj text not null,
  legal_name text not null,
  trade_name text,
  primary_cnae_id uuid references cnae (id),
  municipality_id uuid references municipality (id),
  status text not null default 'ativa' check (status in ('ativa', 'inativa')),
  data_classification text not null default 'interno' check (data_classification = 'interno'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, cnpj),
  foreign key (branch_id, tenant_id) references branch (id, tenant_id)
);

create table establishment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  company_id uuid not null,
  cnpj text not null,
  kind text not null check (kind in ('matriz', 'filial')),
  cnae_id uuid references cnae (id),
  municipality_id uuid references municipality (id),
  data_classification text not null default 'interno' check (data_classification = 'interno'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, cnpj),
  foreign key (company_id, tenant_id) references company (id, tenant_id)
);

create index company_tenant_cnpj_idx on company (tenant_id, cnpj);
create index company_tenant_legal_name_idx on company (tenant_id, legal_name);
create index establishment_company_idx on establishment (company_id, tenant_id);

alter table company enable row level security;
alter table establishment enable row level security;

create policy company_isolation on company for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy establishment_isolation on establishment for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));
