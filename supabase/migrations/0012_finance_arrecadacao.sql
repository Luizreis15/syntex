-- Lote 2 — Arrecadação mínima: obrigação (snapshot imutável) → cobrança →
-- baixa manual → subledger de partida dobrada. Outbox nos writes externos.
-- Ver fundacao/05-roadmap-execucao.md etapas 11–20 e CLAUDE.md #3/#4.

-- ---------------------------------------------------------------------------
-- contribution_rule: impedir sobreposição de vigência do mesmo tipo na CCT
-- ---------------------------------------------------------------------------
alter table contribution_rule
  add constraint contribution_rule_no_overlap
  exclude using gist (
    collective_agreement_id with =,
    type with =,
    daterange(valid_from, coalesce(valid_until, 'infinity'::date), '[]') with &&
  );

-- ---------------------------------------------------------------------------
-- obligation — o que é devido na competência, com snapshot da regra
-- ---------------------------------------------------------------------------
create table obligation (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  company_id uuid not null,
  contribution_rule_id uuid not null,
  competence date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  rule_snapshot jsonb not null,
  status text not null default 'aberta'
    check (status in ('aberta', 'cobrada', 'cancelada')),
  data_classification text not null default 'financeiro' check (data_classification = 'financeiro'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  -- Idempotência: uma obrigação por empresa+regra+competência
  unique (tenant_id, company_id, contribution_rule_id, competence),
  foreign key (company_id, tenant_id) references company (id, tenant_id),
  foreign key (contribution_rule_id, tenant_id) references contribution_rule (id, tenant_id),
  -- Competência = primeiro dia do mês
  check (competence = date_trunc('month', competence::timestamp)::date)
);

create index obligation_tenant_competence_idx on obligation (tenant_id, competence desc);
create index obligation_tenant_company_idx on obligation (tenant_id, company_id);

-- Snapshot e valor não mudam depois de gravados (só status pode evoluir).
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
  then
    raise exception 'obligation: rule_snapshot, amount, competence e vínculos são imutáveis';
  end if;
  return new;
end;
$$;

create trigger obligation_immutable_fields
  before update on obligation
  for each row execute function obligation_forbid_immutable_fields();

-- ---------------------------------------------------------------------------
-- charge — instrumento de cobrança da obrigação
-- ---------------------------------------------------------------------------
create table charge (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  obligation_id uuid not null,
  amount numeric(14, 2) not null check (amount >= 0),
  due_date date not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'pago', 'cancelado', 'vencido')),
  paid_at timestamptz,
  payment_method text check (payment_method is null or payment_method in ('manual')),
  data_classification text not null default 'financeiro' check (data_classification = 'financeiro'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (obligation_id, tenant_id) references obligation (id, tenant_id),
  check (
    (status = 'pago' and paid_at is not null and payment_method is not null)
    or (status <> 'pago' and paid_at is null)
  )
);

create index charge_tenant_status_idx on charge (tenant_id, status, due_date);

-- ---------------------------------------------------------------------------
-- Subledger — partida dobrada mínima
-- ---------------------------------------------------------------------------
create table journal_entry (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  charge_id uuid not null,
  description text not null,
  occurred_at timestamptz not null default now(),
  data_classification text not null default 'financeiro' check (data_classification = 'financeiro'),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, charge_id),
  foreign key (charge_id, tenant_id) references charge (id, tenant_id)
);

create table journal_line (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  journal_entry_id uuid not null,
  account text not null,
  debit numeric(14, 2) not null default 0 check (debit >= 0),
  credit numeric(14, 2) not null default 0 check (credit >= 0),
  unique (id, tenant_id),
  foreign key (journal_entry_id, tenant_id) references journal_entry (id, tenant_id),
  check (debit = 0 or credit = 0),
  check (debit > 0 or credit > 0)
);

-- Invariante: por lançamento, soma débito = soma crédito.
create or replace function journal_entry_balanced()
returns trigger
language plpgsql
as $$
declare
  v_debit numeric(14, 2);
  v_credit numeric(14, 2);
  v_entry_id uuid;
  v_tenant_id uuid;
begin
  if tg_table_name = 'journal_line' then
    v_entry_id := coalesce(new.journal_entry_id, old.journal_entry_id);
    v_tenant_id := coalesce(new.tenant_id, old.tenant_id);
  else
    return coalesce(new, old);
  end if;

  select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into v_debit, v_credit
  from journal_line
  where journal_entry_id = v_entry_id and tenant_id = v_tenant_id;

  if v_debit <> v_credit then
    raise exception 'journal_entry % desbalanceado: débito % ≠ crédito %', v_entry_id, v_debit, v_credit;
  end if;
  return coalesce(new, old);
end;
$$;

-- Valida após cada linha (deferível seria ideal; para MVP constraint imediata
-- exige inserir as duas linhas na mesma statement ou usar a RPC de baixa).
create constraint trigger journal_line_balanced
  after insert or update or delete on journal_line
  deferrable initially deferred
  for each row execute function journal_entry_balanced();

-- ---------------------------------------------------------------------------
-- Baixa manual atômica: charge → journal → outbox (mesma transação)
-- ---------------------------------------------------------------------------
create or replace function settle_charge_manual(p_tenant_id uuid, p_charge_id uuid)
returns charge
language plpgsql
security invoker
as $$
declare
  v_charge charge;
  v_entry_id uuid;
begin
  select * into v_charge
  from charge
  where id = p_charge_id and tenant_id = p_tenant_id
  for update;

  if not found then
    raise exception 'charge não encontrada';
  end if;
  if v_charge.status <> 'pendente' and v_charge.status <> 'vencido' then
    raise exception 'charge % não pode ser baixada no status %', p_charge_id, v_charge.status;
  end if;

  update charge
    set status = 'pago',
        paid_at = now(),
        payment_method = 'manual'
  where id = p_charge_id and tenant_id = p_tenant_id
  returning * into v_charge;

  update obligation
    set status = 'cobrada'
  where id = v_charge.obligation_id and tenant_id = p_tenant_id and status = 'aberta';

  insert into journal_entry (tenant_id, charge_id, description)
  values (p_tenant_id, p_charge_id, 'Baixa manual de cobrança')
  returning id into v_entry_id;

  insert into journal_line (tenant_id, journal_entry_id, account, debit, credit) values
    (p_tenant_id, v_entry_id, 'caixa', v_charge.amount, 0),
    (p_tenant_id, v_entry_id, 'contas_a_receber', 0, v_charge.amount);

  insert into outbox_event (tenant_id, aggregate_type, aggregate_id, event_type, payload)
  values (
    p_tenant_id,
    'charge',
    p_charge_id,
    'charge.settled',
    jsonb_build_object(
      'charge_id', p_charge_id,
      'obligation_id', v_charge.obligation_id,
      'amount', v_charge.amount,
      'payment_method', 'manual'
    )
  );

  return v_charge;
end;
$$;

-- ---------------------------------------------------------------------------
-- Outbox em create
-- ---------------------------------------------------------------------------
create trigger obligation_created_outbox
  after insert on obligation
  for each row execute function emit_outbox_event('obligation');

create trigger charge_created_outbox
  after insert on charge
  for each row execute function emit_outbox_event('charge');

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table obligation enable row level security;
alter table charge enable row level security;
alter table journal_entry enable row level security;
alter table journal_line enable row level security;

create policy obligation_isolation on obligation for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy charge_isolation on charge for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy journal_entry_isolation on journal_entry for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

create policy journal_line_isolation on journal_line for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

grant execute on function settle_charge_manual(uuid, uuid) to authenticated;
grant execute on function settle_charge_manual(uuid, uuid) to service_role;
