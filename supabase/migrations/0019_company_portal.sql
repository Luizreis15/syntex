-- Lote 8 — permissões do portal empresa (pagar guia + convidar operador).

insert into permission (key, description) values
  ('finance.pay', 'Emitir intent e sincronizar pagamento da própria empresa'),
  ('company.user.invite', 'Convidar company_user para a própria empresa')
on conflict (key) do nothing;
