-- Lote 5 — Asaas: customer id na empresa + link de pagamento na charge.

alter table company
  add column asaas_customer_id text;

alter table charge
  add column payment_link text;

comment on column company.asaas_customer_id is
  'ID do customer no Asaas (reutilizado entre cobranças). Null até o primeiro intent Asaas.';
