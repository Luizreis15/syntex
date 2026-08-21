-- Lote 9 — portal associado: vínculo person↔ app_user + convite por person.

alter table person
  add column app_user_id uuid;

alter table person
  add constraint person_app_user_id_tenant_id_fkey
  foreign key (app_user_id, tenant_id) references app_user (id, tenant_id);

create unique index person_tenant_app_user_uidx
  on person (tenant_id, app_user_id)
  where app_user_id is not null;

comment on column person.app_user_id is
  'Login do portal associado (1:1). Null até emitir/aceitar acesso.';

alter table staff_invite
  add column person_id uuid;

alter table staff_invite
  add constraint staff_invite_person_id_tenant_id_fkey
  foreign key (person_id, tenant_id) references person (id, tenant_id);

comment on column staff_invite.person_id is
  'Convite de associado: ao aceitar, liga person.app_user_id.';

insert into permission (key, description) values
  ('associate.access.issue', 'Emitir acesso ao portal do associado no cadastro')
on conflict (key) do nothing;
