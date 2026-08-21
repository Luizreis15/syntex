-- Control plane: dados básicos do sindicato no provisionamento.

alter table tenant
  add column if not exists trade_name text,
  add column if not exists sector text,
  add column if not exists email text,
  add column if not exists phone text;

comment on column tenant.sector is
  'Ramo/setor descritivo (ex.: comércio). Não é department interno.';
comment on column tenant.trade_name is 'Nome fantasia do sindicato.';
