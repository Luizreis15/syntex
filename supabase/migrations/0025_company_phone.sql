-- Contato telefônico da empresa (Cadastro operacional / checklist Veramo).

alter table company
  add column if not exists phone text;

comment on column company.phone is
  'Telefone principal da empresa no cadastro do sindicato.';
