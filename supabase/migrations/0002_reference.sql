-- Tabelas de referência globais: sem tenant_id, read-only para a aplicação.
-- RLS habilitada (invariante #1) com policy permissiva de leitura, já que o
-- dado é público por natureza (código IBGE, código CNAE).

create table municipality (
  id uuid primary key default gen_random_uuid(),
  ibge_code text not null unique,
  name text not null,
  state_code char(2) not null,
  data_classification text not null default 'publico' check (data_classification = 'publico')
);

create table cnae (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  section char(1) not null,
  data_classification text not null default 'publico' check (data_classification = 'publico')
);

alter table municipality enable row level security;
alter table cnae enable row level security;

create policy municipality_read_all on municipality for select using (true);
create policy cnae_read_all on cnae for select using (true);

-- Sem policy de insert/update/delete: só service_role (que ignora RLS) escreve,
-- via migration/seed. A aplicação nunca grava referência global.
