-- Transversais: auditoria (append-only, com classificação do dado acessado)
-- e outbox transacional (evento gravado na mesma transação do write).

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  actor_id uuid,
  action text not null check (action in ('read', 'create', 'update', 'delete')),
  resource_table text not null,
  resource_id uuid,
  data_classification text not null check (
    data_classification in ('publico', 'interno', 'pessoal', 'sensivel', 'financeiro', 'juridico', 'saude')
  ),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (actor_id, tenant_id) references app_user (id, tenant_id)
);

create index audit_log_tenant_occurred_idx on audit_log (tenant_id, occurred_at desc);
create index audit_log_tenant_classification_idx on audit_log (tenant_id, data_classification);

-- Append-only: nenhuma UPDATE/DELETE, nem por engano em código futuro.
create function audit_log_forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log é append-only: % não é permitido', tg_op;
end;
$$;

create trigger audit_log_no_update
  before update on audit_log
  for each row execute function audit_log_forbid_mutation();

create trigger audit_log_no_delete
  before delete on audit_log
  for each row execute function audit_log_forbid_mutation();

create table outbox_event (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  payload jsonb not null,
  occurred_at timestamptz not null default now(),
  published_at timestamptz,
  unique (id, tenant_id)
);

create index outbox_event_unpublished_idx on outbox_event (tenant_id, occurred_at) where published_at is null;

alter table audit_log enable row level security;
alter table outbox_event enable row level security;

-- Leitura isolada por tenant; escrita fica a cargo da aplicação (insert),
-- nunca update/delete (bloqueado pelo trigger acima, independente de RLS).
create policy audit_log_isolation on audit_log for select
  using (tenant_id in (select app_current_tenant_ids()));

create policy audit_log_insert on audit_log for insert
  with check (tenant_id in (select app_current_tenant_ids()));

create policy outbox_event_isolation on outbox_event for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));
