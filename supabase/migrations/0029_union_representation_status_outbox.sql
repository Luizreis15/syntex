-- Outbox para mudança de status de union_representation (Slice A1 — RECONHECER).
-- Payload sem evidence (dado jurídico sensível).

create or replace function emit_union_representation_status_outbox()
returns trigger
language plpgsql
as $$
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  insert into outbox_event (tenant_id, aggregate_type, aggregate_id, event_type, payload)
  values (
    new.tenant_id,
    'union_representation',
    new.id,
    'union_representation.status_changed',
    jsonb_build_object(
      'id', new.id,
      'establishment_id', new.establishment_id,
      'old_status', old.status,
      'new_status', new.status,
      'valid_from', new.valid_from,
      'valid_until', new.valid_until,
      'basis', new.basis,
      'classification', new.data_classification
    )
  );

  return new;
end;
$$;

create trigger union_representation_status_outbox
  after update of status on union_representation
  for each row execute function emit_union_representation_status_outbox();
