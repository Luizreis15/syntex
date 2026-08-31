-- Operational Core — Planos de arrecadação (cabeçalho) + regra de cálculo (átomo)
-- + apuração por competência + obrigação com DEVEDOR × REPASSADORA.
--
-- Pacote aprovado PO 30/08/2026:
--   1a) revenue_plan própria (V1: 1 plano → 1 contribution_rule; sem faixas/parcelas)
--   1b) CCT condicional por source_type (não só FK frouxo)
--   2) obligation distingue debtor_* de remitting_company_id

-- ---------------------------------------------------------------------------
-- 1. revenue_plan — catálogo operacional
-- ---------------------------------------------------------------------------
create table revenue_plan (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  name text not null,
  type text not null
    check (type in (
      'assistencial', 'confederativa', 'mensalidade', 'negocial',
      'sindical', 'patronal', 'servico', 'outro'
    )),
  source_type text not null
    check (source_type in (
      'collective_agreement', 'assembly', 'statute',
      'individual_authorization', 'contract'
    )),
  collective_agreement_id uuid,
  clause_reference text,
  liable_party text not null
    check (liable_party in ('worker', 'member', 'company')),
  collection_role text not null
    check (collection_role in ('employer_remittance', 'direct')),
  audience text not null
    check (audience in (
      'represented_workers', 'members', 'authorized_workers', 'companies'
    )),
  frequency text not null
    check (frequency in ('monthly', 'single')),
  due_day smallint not null
    check (due_day between 1 and 28),
  opposition_applies boolean not null default false,
  status text not null
    check (status in ('draft', 'active', 'inactive')),
  valid_from date not null,
  valid_until date,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data_classification text not null default 'financeiro'
    check (data_classification = 'financeiro'),
  unique (id, tenant_id),
  foreign key (collective_agreement_id, tenant_id)
    references collective_agreement (id, tenant_id),
  foreign key (created_by, tenant_id) references app_user (id, tenant_id),
  check (valid_until is null or valid_until >= valid_from),
  -- 1b) CCT condicional
  check (
    source_type <> 'collective_agreement'
    or collective_agreement_id is not null
  ),
  check (
    source_type = 'collective_agreement'
    or collective_agreement_id is null
  ),
  -- mensalidade associativa não nasce de CCT
  check (
    type <> 'mensalidade'
    or source_type in ('statute', 'assembly', 'individual_authorization')
  )
);

comment on table revenue_plan is
  'Cabeçalho do plano de arrecadação: fundamento, sujeito, recolhimento, público e vigência.';

create index revenue_plan_tenant_status_idx
  on revenue_plan (tenant_id, status, valid_from desc);

-- Sobreposição do mesmo tipo + mesmo fundamento (CCT ou “sem CCT”)
alter table revenue_plan
  add constraint revenue_plan_no_overlap
  exclude using gist (
    tenant_id with =,
    type with =,
    coalesce(collective_agreement_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    daterange(valid_from, coalesce(valid_until, 'infinity'::date), '[]') with &&
  ) where (status <> 'inactive');

alter table revenue_plan enable row level security;

create policy revenue_plan_isolation on revenue_plan for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create trigger revenue_plan_created_outbox
  after insert on revenue_plan
  for each row execute function emit_outbox_event('revenue_plan');

-- ---------------------------------------------------------------------------
-- 2. contribution_rule — átomo de cálculo (1:1 com plano no V1)
-- ---------------------------------------------------------------------------
alter table contribution_rule
  drop constraint if exists contribution_rule_no_overlap;

alter table contribution_rule
  drop constraint if exists contribution_rule_type_check;

alter table contribution_rule
  alter column collective_agreement_id drop not null,
  add column revenue_plan_id uuid,
  add column calculation_method text,
  add column _migrate_plan_id uuid;

-- IDs estáveis para amarração 1:1 regra → plano.
update contribution_rule
set _migrate_plan_id = gen_random_uuid()
where _migrate_plan_id is null;

-- Backfill: um plano por regra. Mensalidade legada sai de CCT → statute (1b).
insert into revenue_plan (
  id,
  tenant_id,
  name,
  type,
  source_type,
  collective_agreement_id,
  liable_party,
  collection_role,
  audience,
  frequency,
  due_day,
  opposition_applies,
  status,
  valid_from,
  valid_until
)
select
  r._migrate_plan_id,
  r.tenant_id,
  case
    when r.type = 'mensalidade' then initcap(r.type) || ' · estatuto (legado)'
    else initcap(r.type) || coalesce(' · ' || a.mediador_number, '')
  end,
  r.type,
  case when r.type = 'mensalidade' then 'statute' else 'collective_agreement' end,
  case when r.type = 'mensalidade' then null else r.collective_agreement_id end,
  case when r.type = 'mensalidade' then 'member' else 'worker' end,
  'employer_remittance',
  case
    when r.type in ('mensalidade', 'confederativa') then 'members'
    else 'represented_workers'
  end,
  'monthly',
  10,
  r.type in ('assistencial', 'negocial'),
  'active',
  r.valid_from,
  r.valid_until
from contribution_rule r
left join collective_agreement a
  on a.id = r.collective_agreement_id
 and a.tenant_id = r.tenant_id;

update contribution_rule r
set
  revenue_plan_id = r._migrate_plan_id,
  calculation_method = case
    when r.value_type = 'percentual' then 'declared_payroll_percentage'
    else 'fixed_company'
  end,
  collective_agreement_id = p.collective_agreement_id
from revenue_plan p
where p.id = r._migrate_plan_id;

alter table contribution_rule
  drop column _migrate_plan_id;

alter table contribution_rule
  alter column revenue_plan_id set not null,
  alter column calculation_method set not null,
  add constraint contribution_rule_type_check
    check (type in (
      'assistencial', 'confederativa', 'mensalidade', 'negocial',
      'sindical', 'patronal', 'servico', 'outro'
    )),
  add constraint contribution_rule_calculation_method_check
    check (calculation_method in (
      'floor_headcount_percentage',
      'declared_payroll_percentage',
      'fixed_per_worker',
      'fixed_company'
    )),
  add constraint contribution_rule_value_method_check
    check (
      (calculation_method in ('floor_headcount_percentage', 'declared_payroll_percentage')
        and value_type = 'percentual')
      or
      (calculation_method in ('fixed_per_worker', 'fixed_company')
        and value_type = 'valor_fixo')
    ),
  add constraint contribution_rule_revenue_plan_fkey
    foreign key (revenue_plan_id, tenant_id) references revenue_plan (id, tenant_id),
  add constraint contribution_rule_plan_unique unique (revenue_plan_id);

-- Compat: inserts legados (testes/seed) sem revenue_plan_id criam o plano 1:1.
create or replace function contribution_rule_ensure_revenue_plan()
returns trigger
language plpgsql
as $$
declare
  v_plan_id uuid;
  v_source text;
  v_agreement uuid;
  v_name text;
begin
  if new.revenue_plan_id is not null then
    new.calculation_method := coalesce(
      new.calculation_method,
      case when new.value_type = 'percentual' then 'declared_payroll_percentage' else 'fixed_company' end
    );
    return new;
  end if;

  v_source := case
    when new.collective_agreement_id is null then 'statute'
    when new.type = 'mensalidade' then 'statute'
    else 'collective_agreement'
  end;
  v_agreement := case
    when v_source = 'collective_agreement' then new.collective_agreement_id
    else null
  end;
  v_name := initcap(new.type) || ' · plano legado';

  insert into revenue_plan (
    tenant_id, name, type, source_type, collective_agreement_id,
    liable_party, collection_role, audience, frequency, due_day,
    opposition_applies, status, valid_from, valid_until
  ) values (
    new.tenant_id,
    v_name,
    new.type,
    v_source,
    v_agreement,
    case when new.type = 'mensalidade' then 'member' else 'worker' end,
    'employer_remittance',
    case when new.type in ('mensalidade', 'confederativa') then 'members' else 'represented_workers' end,
    'monthly',
    10,
    new.type in ('assistencial', 'negocial'),
    'active',
    new.valid_from,
    new.valid_until
  )
  returning id into v_plan_id;

  new.revenue_plan_id := v_plan_id;
  new.collective_agreement_id := v_agreement;
  new.calculation_method := coalesce(
    new.calculation_method,
    case when new.value_type = 'percentual' then 'declared_payroll_percentage' else 'fixed_company' end
  );
  return new;
end;
$$;

create trigger contribution_rule_ensure_plan
  before insert on contribution_rule
  for each row execute function contribution_rule_ensure_revenue_plan();

-- ---------------------------------------------------------------------------
-- 3. contribution_assessment — memória de cálculo por competência
-- ---------------------------------------------------------------------------
create table contribution_assessment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  revenue_plan_id uuid not null,
  contribution_rule_id uuid not null,
  -- Empresa de contexto da apuração (folha/estabelecimento). NÃO é automaticamente o devedor.
  company_id uuid not null,
  establishment_id uuid,
  competence date not null,
  headcount integer check (headcount is null or headcount >= 0),
  headcount_source text check (
    headcount_source is null
    or headcount_source in (
      'company_registration', 'finance_confirmed', 'company_declared', 'system_workers'
    )
  ),
  category_floor numeric(14, 2) check (category_floor is null or category_floor >= 0),
  declared_payroll numeric(14, 2) check (declared_payroll is null or declared_payroll >= 0),
  unit_amount numeric(14, 2) check (unit_amount is null or unit_amount >= 0),
  amount numeric(14, 2) not null check (amount >= 0),
  calculation_snapshot jsonb not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'charged', 'cancelled')),
  created_by uuid not null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  data_classification text not null default 'financeiro'
    check (data_classification = 'financeiro'),
  unique (id, tenant_id),
  foreign key (revenue_plan_id, tenant_id) references revenue_plan (id, tenant_id),
  foreign key (contribution_rule_id, tenant_id) references contribution_rule (id, tenant_id),
  foreign key (company_id, tenant_id) references company (id, tenant_id),
  foreign key (establishment_id, tenant_id) references establishment (id, tenant_id),
  foreign key (created_by, tenant_id) references app_user (id, tenant_id),
  check (competence = date_trunc('month', competence::timestamp)::date)
);

create unique index contribution_assessment_current_uidx
  on contribution_assessment (
    tenant_id,
    revenue_plan_id,
    company_id,
    coalesce(establishment_id, '00000000-0000-0000-0000-000000000000'::uuid),
    competence
  )
  where status <> 'cancelled';

create index contribution_assessment_tenant_competence_idx
  on contribution_assessment (tenant_id, competence desc, status);

alter table contribution_assessment enable row level security;

create policy contribution_assessment_isolation on contribution_assessment for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create trigger contribution_assessment_created_outbox
  after insert on contribution_assessment
  for each row execute function emit_outbox_event('contribution_assessment');

create or replace function contribution_assessment_forbid_financial_update()
returns trigger
language plpgsql
as $$
begin
  if old.revenue_plan_id is distinct from new.revenue_plan_id
     or old.contribution_rule_id is distinct from new.contribution_rule_id
     or old.company_id is distinct from new.company_id
     or old.establishment_id is distinct from new.establishment_id
     or old.competence is distinct from new.competence
     or old.headcount is distinct from new.headcount
     or old.headcount_source is distinct from new.headcount_source
     or old.category_floor is distinct from new.category_floor
     or old.declared_payroll is distinct from new.declared_payroll
     or old.unit_amount is distinct from new.unit_amount
     or old.amount is distinct from new.amount
     or old.calculation_snapshot is distinct from new.calculation_snapshot
  then
    raise exception 'contribution_assessment: memória de cálculo é imutável';
  end if;
  return new;
end;
$$;

create trigger contribution_assessment_immutable_financial_fields
  before update on contribution_assessment
  for each row execute function contribution_assessment_forbid_financial_update();

comment on table contribution_assessment is
  'Memória imutável da apuração de um plano em uma competência (empresa = contexto).';

-- ---------------------------------------------------------------------------
-- 4. obligation — DEVEDOR × REPASSADORA (+ vínculo à apuração)
-- ---------------------------------------------------------------------------
alter table obligation
  add column assessment_id uuid,
  add column debtor_kind text,
  add column debtor_company_id uuid,
  add column debtor_person_id uuid,
  add column remitting_company_id uuid;

-- Histórico: company_id era o único vínculo → trata como empresa DEVEDORA.
update obligation
set
  debtor_kind = 'company',
  debtor_company_id = company_id,
  remitting_company_id = null
where debtor_kind is null;

alter table obligation
  alter column debtor_kind set not null,
  add constraint obligation_debtor_kind_check
    check (debtor_kind in ('worker', 'member', 'company')),
  add constraint obligation_debtor_shape_check
    check (
      (debtor_kind = 'company'
        and debtor_company_id is not null
        and debtor_person_id is null)
      or
      (debtor_kind in ('worker', 'member')
        and debtor_company_id is null)
    ),
  add constraint obligation_assessment_id_tenant_fkey
    foreign key (assessment_id, tenant_id)
      references contribution_assessment (id, tenant_id),
  add constraint obligation_debtor_company_fkey
    foreign key (debtor_company_id, tenant_id)
      references company (id, tenant_id),
  add constraint obligation_remitting_company_fkey
    foreign key (remitting_company_id, tenant_id)
      references company (id, tenant_id),
  add constraint obligation_debtor_person_fkey
    foreign key (debtor_person_id, tenant_id)
      references person (id, tenant_id);

create unique index obligation_assessment_uidx
  on obligation (tenant_id, assessment_id)
  where assessment_id is not null;

comment on column obligation.company_id is
  'Empresa de contexto (legado / apuração). Não confundir com debtor_company_id nem remitting_company_id.';
comment on column obligation.debtor_kind is
  'Quem economicamente deve: worker | member | company.';
comment on column obligation.remitting_company_id is
  'Empresa que desconta/repassa (employer_remittance). Null em cobrança direta.';

-- Imutabilidade: incluir novos vínculos.
create or replace function obligation_forbid_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if old.rule_snapshot is distinct from new.rule_snapshot
     or old.amount is distinct from new.amount
     or old.competence is distinct from new.competence
     or old.contribution_rule_id is distinct from new.contribution_rule_id
     or old.company_id is distinct from new.company_id
     or old.assessment_id is distinct from new.assessment_id
     or old.debtor_kind is distinct from new.debtor_kind
     or old.debtor_company_id is distinct from new.debtor_company_id
     or old.debtor_person_id is distinct from new.debtor_person_id
     or old.remitting_company_id is distinct from new.remitting_company_id
  then
    raise exception 'obligation: snapshot, valor, competência e vínculos (incl. devedor/repassadora) são imutáveis';
  end if;
  return new;
end;
$$;
