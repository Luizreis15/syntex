-- Lote 12 — cancelamento operacional de cobrança + inbox do control plane.

alter table charge
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists cancelled_by_platform_admin_id uuid references platform_admin (id);

alter table charge
  drop constraint if exists charge_paid_fields_check;

alter table charge
  add constraint charge_paid_fields_check
  check (
    (status = 'pago' and paid_at is not null and payment_method is not null)
    or (status <> 'pago' and paid_at is null)
  );

alter table charge
  drop constraint if exists charge_cancel_fields_check;

alter table charge
  add constraint charge_cancel_fields_check
  check (
    (status = 'cancelado' and cancelled_at is not null and cancel_reason is not null)
    or (status <> 'cancelado' and cancelled_at is null)
  );

create or replace function cancel_charge(
  p_tenant_id uuid,
  p_charge_id uuid,
  p_reason text,
  p_platform_admin_id uuid default null
)
returns charge
language plpgsql
security invoker
as $$
declare
  v_charge charge;
begin
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'motivo de cancelamento obrigatório (mín. 3 caracteres)';
  end if;

  select * into v_charge
  from charge
  where id = p_charge_id and tenant_id = p_tenant_id
  for update;

  if not found then
    raise exception 'charge não encontrada';
  end if;
  if v_charge.status = 'cancelado' then
    raise exception 'charge já cancelada';
  end if;
  if v_charge.status = 'pago' then
    raise exception 'charge paga não pode ser cancelada';
  end if;
  if v_charge.status not in ('pendente', 'vencido') then
    raise exception 'charge % não pode ser cancelada no status %', p_charge_id, v_charge.status;
  end if;

  update charge
    set status = 'cancelado',
        cancelled_at = now(),
        cancel_reason = trim(p_reason),
        cancelled_by_platform_admin_id = p_platform_admin_id
  where id = p_charge_id and tenant_id = p_tenant_id
  returning * into v_charge;

  update obligation
    set status = 'cancelada'
  where id = v_charge.obligation_id
    and tenant_id = p_tenant_id
    and status in ('aberta', 'cobrada');

  insert into outbox_event (tenant_id, aggregate_type, aggregate_id, event_type, payload)
  values (
    p_tenant_id,
    'charge',
    p_charge_id,
    'charge.cancelled',
    jsonb_build_object(
      'charge_id', p_charge_id,
      'obligation_id', v_charge.obligation_id,
      'reason', trim(p_reason),
      'by_platform_admin', p_platform_admin_id
    )
  );

  return v_charge;
end;
$$;

-- Inbox operacional do control plane (não é e-mail Resend nesta fatia).
create table platform_notification (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'critical')),
  tenant_id uuid references tenant (id),
  charge_id uuid,
  created_by_platform_admin_id uuid references platform_admin (id),
  read_at timestamptz,
  data_classification text not null default 'interno' check (data_classification = 'interno'),
  created_at timestamptz not null default now()
);

create index platform_notification_created_idx
  on platform_notification (created_at desc);

create index platform_notification_unread_idx
  on platform_notification (created_at desc)
  where read_at is null;

alter table platform_notification enable row level security;
-- Sem policy para authenticated: leitura/escrita só via service_role (platform session).

comment on table platform_notification is
  'Alertas do control plane. Canal e-mail/WhatsApp fica para fatia futura.';
