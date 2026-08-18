# ADR-002 — Multi-tenancy com FK composta

- Status: aceita
- Data: 2026-08-18

## Contexto

Syntex é uma plataforma multi-tenant: cada sindicato é um tenant, com dados isolados dos demais. RLS sozinha protege leitura (`SELECT`), mas não protege integridade referencial — um `INSERT` malformado (por bug de aplicação, não por ataque) pode criar um filho apontando para um pai de outro tenant, e RLS não impede isso porque RLS filtra linhas visíveis, não valida FKs.

## Decisão

Toda tabela de tenant:

1. Tem `tenant_id uuid NOT NULL`.
2. Tem `UNIQUE (id, tenant_id)` além do `PRIMARY KEY (id)`.
3. Toda FK para outra tabela de tenant é **composta**: `FOREIGN KEY (parent_id, tenant_id) REFERENCES parent (id, tenant_id)`.

Isso faz o Postgres recusar uma referência cross-tenant no nível de constraint — testado explicitamente em `apps/web/tests/isolation.test.ts` inserindo com `service_role` (que ignora RLS) para provar que quem barra é a FK, não a policy.

Duas exceções deliberadas, ambas testadas por `test_tenant_fks_not_composite()`:

- FKs para tabelas **globais** (`municipality`, `cnae`, `permission`) permanecem single-column — essas tabelas não têm `tenant_id`, então não há "outro tenant" para vazar.
- FKs para a própria tabela `tenant` (ex.: `branch.tenant_id -> tenant.id`) são single-column por definição — é a raiz da árvore de isolamento.

## Consequências

- Toda migration nova que adiciona uma tabela de tenant precisa seguir o padrão nos três pontos acima, ou o teste estrutural (`tests/structural.test.ts`) falha — a checagem varre `pg_catalog`, não uma lista mantida à mão, então uma tabela esquecida quebra o CI.
- Embedding via PostgREST em FK composta exige o nome da constraint explícito no `select` (ver ADR-001).
- `union_representation` intencionalmente permite múltiplas linhas sobrepostas para o mesmo `establishment_id` quando o status não é `reconhecida` — isso não é uma exceção ao isolamento de tenant (a FK continua composta), é uma decisão de domínio separada, documentada em ADR-003.
