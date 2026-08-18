-- Função só para o teste de outbox: força um ROLLBACK depois do insert, para
-- provar que o outbox_event gravado pelo trigger (0007) volta junto — não
-- fica órfão quando a transação que o originou é revertida.
create or replace function test_rollback_company_insert(p_tenant_id uuid, p_cnpj text)
returns void
language plpgsql
as $$
begin
  insert into company (tenant_id, cnpj, legal_name) values (p_tenant_id, p_cnpj, 'Rollback Test');
  raise exception 'forced_rollback_for_test';
end;
$$;
