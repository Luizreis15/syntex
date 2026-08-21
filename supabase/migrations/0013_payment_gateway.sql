-- Lote 3 — Porta de pagamento: provider por tenant, campos de intent na charge,
-- webhook idempotente. Adaptadores reais (Asaas/Itaú) entram nos lotes 5–6.
-- Ver fundacao/05-roadmap-execucao.md e packages/payments.

-- ---------------------------------------------------------------------------
-- Tenant: provider padrão (mesmo vocabulário do Veramo + stub de desenvolvimento)
-- ---------------------------------------------------------------------------
alter table tenant
  add column default_charge_provider text not null default 'stub'
    check (default_charge_provider in ('stub', 'asaas', 'itau_bolecode'));

-- ---------------------------------------------------------------------------
-- Charge: intent de gateway
-- ---------------------------------------------------------------------------
alter table charge drop constraint if exists charge_payment_method_check;
alter table charge
  add constraint charge_payment_method_check
  check (payment_method is null or payment_method in ('manual', 'pix', 'boleto'));

alter table charge
  add column provider text
    check (provider is null or provider in ('stub', 'asaas', 'itau_bolecode')),
  add column provider_charge_id text,
  add column billing_type text
    check (billing_type is null or billing_type in ('pix', 'boleto')),
  add column pix_copy_paste text,
  add column boleto_url text,
  add column barcode text,
  add column provider_payload jsonb not null default '{}'::jsonb;

create unique index charge_provider_external_uidx
  on charge (tenant_id, provider, provider_charge_id)
  where provider_charge_id is not null;

-- ---------------------------------------------------------------------------
-- Webhook idempotente (external_event_id único por tenant+provider)
-- ---------------------------------------------------------------------------
create table payment_webhook_event (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant (id),
  provider text not null check (provider in ('stub', 'asaas', 'itau_bolecode')),
  external_event_id text not null,
  payload jsonb not null,
  charge_id uuid,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, provider, external_event_id),
  foreign key (charge_id, tenant_id) references charge (id, tenant_id)
);

create index payment_webhook_event_unprocessed_idx
  on payment_webhook_event (tenant_id, created_at)
  where processed_at is null;

alter table payment_webhook_event enable row level security;

create policy payment_webhook_event_isolation on payment_webhook_event for all
  using (tenant_id in (select app_current_tenant_ids()))
  with check (tenant_id in (select app_current_tenant_ids()));

-- ---------------------------------------------------------------------------
-- Baixa genérica (manual ou via gateway)
-- ---------------------------------------------------------------------------
create or replace function settle_charge(
  p_tenant_id uuid,
  p_charge_id uuid,
  p_payment_method text default 'manual'
)
returns charge
language plpgsql
security invoker
as $$
declare
  v_charge charge;
  v_entry_id uuid;
begin
  if p_payment_method not in ('manual', 'pix', 'boleto') then
    raise exception 'payment_method inválido: %', p_payment_method;
  end if;

  select * into v_charge
  from charge
  where id = p_charge_id and tenant_id = p_tenant_id
  for update;

  if not found then
    raise exception 'charge não encontrada';
  end if;
  if v_charge.status = 'pago' then
    return v_charge; -- idempotente
  end if;
  if v_charge.status <> 'pendente' and v_charge.status <> 'vencido' then
    raise exception 'charge % não pode ser baixada no status %', p_charge_id, v_charge.status;
  end if;

  update charge
    set status = 'pago',
        paid_at = now(),
        payment_method = p_payment_method
  where id = p_charge_id and tenant_id = p_tenant_id
  returning * into v_charge;

  update obligation
    set status = 'cobrada'
  where id = v_charge.obligation_id and tenant_id = p_tenant_id and status = 'aberta';

  -- Ledger só na primeira baixa (unique charge_id)
  if not exists (
    select 1 from journal_entry where tenant_id = p_tenant_id and charge_id = p_charge_id
  ) then
    insert into journal_entry (tenant_id, charge_id, description)
    values (p_tenant_id, p_charge_id, 'Baixa de cobrança (' || p_payment_method || ')')
    returning id into v_entry_id;

    insert into journal_line (tenant_id, journal_entry_id, account, debit, credit) values
      (p_tenant_id, v_entry_id, 'caixa', v_charge.amount, 0),
      (p_tenant_id, v_entry_id, 'contas_a_receber', 0, v_charge.amount);
  end if;

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
      'payment_method', p_payment_method,
      'provider', v_charge.provider,
      'provider_charge_id', v_charge.provider_charge_id
    )
  );

  return v_charge;
end;
$$;

-- Compatível com Lote 2
create or replace function settle_charge_manual(p_tenant_id uuid, p_charge_id uuid)
returns charge
language plpgsql
security invoker
as $$
begin
  return settle_charge(p_tenant_id, p_charge_id, 'manual');
end;
$$;

grant execute on function settle_charge(uuid, uuid, text) to authenticated;
grant execute on function settle_charge(uuid, uuid, text) to service_role;
