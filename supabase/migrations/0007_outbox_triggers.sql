-- Outbox transacional via trigger: todo insert em `company` grava o evento
-- na MESMA transação, não importa o caminho de escrita (API, seed, import
-- futuro). Um rollback do insert reverte o evento junto — sem isso o evento
-- pode se perder entre o commit no Postgres e o publish na fila.

create or replace function emit_outbox_event()
returns trigger
language plpgsql
as $$
begin
  insert into outbox_event (tenant_id, aggregate_type, aggregate_id, event_type, payload)
  values (new.tenant_id, tg_argv[0], new.id, tg_argv[0] || '.created', to_jsonb(new));
  return new;
end;
$$;

create trigger company_created_outbox
  after insert on company
  for each row execute function emit_outbox_event('company');
