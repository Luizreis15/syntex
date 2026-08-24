-- Outbox transacional para claim/write de union_representation (Slice 1.3B).
-- Segue o padrão emit_outbox_event de 0007 / 0014 / 0012.

create trigger union_representation_created_outbox
  after insert on union_representation
  for each row execute function emit_outbox_event('union_representation');
