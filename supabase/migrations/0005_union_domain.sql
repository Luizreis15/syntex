-- Union Domain — o núcleo do produto.
--
-- Decisão estrutural (ver decisoes/ADR-003-union-representation.md):
-- union_representation é vínculo DIRETO ao estabelecimento (não derivado por
-- CNAE+território em tempo de consulta). O enquadramento por CNAE é só uma
-- das origens possíveis (`basis = 'cnae'`); a linha em si é sempre uma
-- afirmação registrada, com autoria e evidência, porque representatividade é
-- disputada e negociada, não recomputável deterministicamente.
--
-- A unicidade sindical (CF art. 8º, II) é modelada como invariante apenas
-- para o status 'reconhecida': no máximo uma representação reconhecida pode
-- estar vigente por estabelecimento em um dado instante. 'reivindicada' e
-- 'disputada' podem se sobrepor livremente — é exatamente isso que
-- representa uma disputa de base. resolveRepresentation() é quem agrega
-- múltiplas linhas vigentes em conflicts[].

create table economic_category (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (id, tenant_id)
);

create table professional_category (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (id, tenant_id)
);

-- Registro/carta sindical no MTE. É entidade, não atributo: um tenant pode
-- registrar tanto a própria carta quanto a de um rival, quando relevante
-- como evidência de uma disputa.
create table union_registration (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  registry_number text not null,
  registered_at date not null,
  economic_category_id uuid,
  professional_category_id uuid,
  document_reference text,
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (economic_category_id, tenant_id) references economic_category (id, tenant_id),
  foreign key (professional_category_id, tenant_id) references professional_category (id, tenant_id),
  check (economic_category_id is not null or professional_category_id is not null)
);

create table union_territory (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  union_registration_id uuid not null,
  municipality_id uuid not null references municipality (id),
  unique (id, tenant_id),
  unique (tenant_id, union_registration_id, municipality_id),
  foreign key (union_registration_id, tenant_id) references union_registration (id, tenant_id)
);

create table union_representation (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  establishment_id uuid not null,
  union_registration_id uuid,
  status text not null check (status in ('reivindicada', 'reconhecida', 'disputada', 'perdida')),
  valid_from date not null,
  valid_until date,
  basis text not null check (basis in ('cnae', 'cct_registrada', 'decisao_judicial', 'carta_sindical', 'manual')),
  evidence text not null,
  decided_by uuid,
  decided_at timestamptz,
  data_classification text not null default 'juridico' check (data_classification = 'juridico'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (establishment_id, tenant_id) references establishment (id, tenant_id),
  foreign key (union_registration_id, tenant_id) references union_registration (id, tenant_id),
  foreign key (decided_by, tenant_id) references app_user (id, tenant_id),
  check (valid_until is null or valid_until >= valid_from),
  -- Unicidade sindical: no máximo uma representação RECONHECIDA vigente por
  -- estabelecimento a qualquer instante. Reivindicações e disputas convivem.
  exclude using gist (
    establishment_id with =,
    daterange(valid_from, coalesce(valid_until, 'infinity'::date), '[]') with &&
  ) where (status = 'reconhecida')
);

create index union_representation_establishment_idx
  on union_representation (establishment_id, tenant_id, valid_from, valid_until);

create table collective_agreement (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  kind text not null check (kind in ('cct', 'act')),
  mediador_number text,
  valid_from date not null,
  valid_until date not null,
  base_date date not null,
  economic_category_id uuid not null,
  professional_category_id uuid not null,
  data_classification text not null default 'juridico' check (data_classification = 'juridico'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (economic_category_id, tenant_id) references economic_category (id, tenant_id),
  foreign key (professional_category_id, tenant_id) references professional_category (id, tenant_id),
  check (valid_until >= valid_from),
  -- No máximo uma CCT/ACT vigente por par de categorias a qualquer instante.
  exclude using gist (
    economic_category_id with =,
    professional_category_id with =,
    daterange(valid_from, valid_until, '[]') with &&
  )
);

create table collective_agreement_territory (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  collective_agreement_id uuid not null,
  municipality_id uuid not null references municipality (id),
  unique (id, tenant_id),
  unique (tenant_id, collective_agreement_id, municipality_id),
  foreign key (collective_agreement_id, tenant_id) references collective_agreement (id, tenant_id)
);

-- Vigência própria dentro da vigência da CCT — sem motor de cálculo aqui,
-- só o CRUD mínimo para a resolução responder "sob qual regra".
create table contribution_rule (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  collective_agreement_id uuid not null,
  type text not null check (type in ('assistencial', 'confederativa', 'mensalidade', 'negocial')),
  valid_from date not null,
  valid_until date,
  calculation_base text not null,
  value_type text not null check (value_type in ('percentual', 'valor_fixo')),
  value numeric(12, 4) not null check (value >= 0),
  data_classification text not null default 'financeiro' check (data_classification = 'financeiro'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (collective_agreement_id, tenant_id) references collective_agreement (id, tenant_id),
  check (valid_until is null or valid_until >= valid_from)
);

alter table economic_category enable row level security;
alter table professional_category enable row level security;
alter table union_registration enable row level security;
alter table union_territory enable row level security;
alter table union_representation enable row level security;
alter table collective_agreement enable row level security;
alter table collective_agreement_territory enable row level security;
alter table contribution_rule enable row level security;

create policy economic_category_isolation on economic_category for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy professional_category_isolation on professional_category for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy union_registration_isolation on union_registration for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy union_territory_isolation on union_territory for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy union_representation_isolation on union_representation for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy collective_agreement_isolation on collective_agreement for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy collective_agreement_territory_isolation on collective_agreement_territory for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy contribution_rule_isolation on contribution_rule for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));
