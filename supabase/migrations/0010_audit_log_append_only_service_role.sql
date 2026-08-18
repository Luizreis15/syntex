-- Ajuste: append-only vale para a aplicação (chave anon + JWT do usuário),
-- não para service_role. service_role já ignora RLS e tem privilégio
-- equivalente a DBA por design (CLAUDE.md #2) — bloquear DELETE/UPDATE para
-- ele não protege nada a mais, só impede rotina operacional legítima
-- (expurgo por política de retenção, limpeza de dado de teste).
create or replace function audit_log_forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'service_role' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  raise exception 'audit_log é append-only: % não é permitido', tg_op;
end;
$$;
