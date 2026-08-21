-- Lote 6 — Itaú Bolecode: config por tenant, endereço do pagador, nosso_numero.

alter table tenant
  add column itau_beneficiario_id text,
  add column itau_pix_key text,
  add column itau_carteira_code text;

comment on column tenant.itau_beneficiario_id is
  'ID do beneficiário no Itaú (config por sindicato/tenant). Sem hardcode SECABC.';
comment on column tenant.itau_pix_key is
  'Chave PIX do beneficiário para Bolecode.';
comment on column tenant.itau_carteira_code is
  'Código de carteira Itaú (ex.: 109).';

alter table company
  add column address_street text,
  add column address_neighborhood text,
  add column address_city text,
  add column address_state text,
  add column address_zip text;

comment on column company.address_street is
  'Logradouro do pagador (exigido para emissão real Itaú).';

alter table charge
  add column nosso_numero text;

create unique index charge_tenant_nosso_numero_uidx
  on charge (tenant_id, nosso_numero)
  where nosso_numero is not null;

comment on column charge.nosso_numero is
  'Nosso número Itaú (8 dígitos determinísticos a partir do charge.id).';
