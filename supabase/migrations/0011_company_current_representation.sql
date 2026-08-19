-- View de leitura: status de representação "hoje" por empresa, agregado a
-- partir do estabelecimento matriz — mesma regra de resolveRepresentation
-- (nenhuma vigente → sem_representacao; mais de uma → disputada; uma só →
-- o próprio status dela). Existe para permitir filtro/ordenação por status
-- na listagem de empresas sem recomputar em TypeScript linha a linha.
--
-- View comum (não SECURITY DEFINER): roda com o privilégio de quem
-- consulta, então RLS das tabelas de origem (company, establishment,
-- union_representation) se aplica normalmente — nenhum isolamento extra
-- precisa ser declarado aqui.
create or replace view company_current_representation as
select
  c.id as company_id,
  c.tenant_id,
  case
    when count(ur.id) = 0 then 'sem_representacao'
    when count(ur.id) > 1 then 'disputada'
    else max(ur.status)
  end as status
from company c
left join establishment e
  on e.company_id = c.id
  and e.tenant_id = c.tenant_id
  and e.kind = 'matriz'
left join union_representation ur
  on ur.establishment_id = e.id
  and ur.tenant_id = e.tenant_id
  and ur.valid_from <= current_date
  and (ur.valid_until is null or ur.valid_until >= current_date)
group by c.id, c.tenant_id;
