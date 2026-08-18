# Prompt 01 — Bootstrap + Primeira Fatia: Union Domain

> Cole isto no Claude Code na pasta `Syntex/`. Ele lê o `CLAUDE.md` automaticamente — os invariantes de lá valem e não se repetem aqui.

---

Você vai inicializar o repositório do Syntex e entregar a primeira fatia vertical completa.

Leia `CLAUDE.md` e `fundacao/00-INDICE.md` antes de começar. Os invariantes do `CLAUDE.md` não são sugestões — o teste de aceitação verifica cada um deles.

## Objetivo

Entregar, funcionando de ponta a ponta:

> **Dado um CNPJ e uma data, o sistema responde: qual sindicato representa esta empresa naquela data, com que status, sob qual convenção coletiva, e com base em qual evidência.**

Essa é a pergunta que nenhum ERP genérico responde. É o núcleo do produto e é o que será demonstrado ao cliente.

## Por que esta fatia

Ela é fina, mas atravessa todos os padrões que o resto do código vai copiar: isolamento de tenant, FK composta, RLS, verificação de permissão na aplicação, vigência temporal com constraint de não-sobreposição, audit log com classificação de dado, evento em outbox transacional, migration em SQL, teste de matriz de permissão e e2e. Acertar aqui uma vez significa repetir depois.

## Não faz parte desta fatia

Não construa, nem "só o esqueleto de":

pessoas, trabalhadores, associados, dependentes · financeiro, cobrança, guias, pagamentos · agenda, serviços, colônia · homologação, jurídico · comunicação, templates, campanhas · portais externos · IA · workflow engine · consulta automática de CNPJ em API externa (cadastro é manual nesta fatia) · design system além do shadcn padrão

Se sentir vontade de adicionar algo desta lista "porque é rápido", não adicione.

---

## Domínio a modelar

O ponto delicado: **representatividade sindical no Brasil não é um fato limpo.** O modelo precisa suportar a realidade, não a versão idealizada.

- Enquadramento por CNAE **não é determinístico** — é interpretação, e é negociada. Registre *quem decidiu* e *com base em quê*, não só o resultado.
- Representação é **disputada** com frequência. Duas entidades podem reivindicar a mesma empresa. O modelo tem que representar isso sem corromper nada.
- A base legal da representação é o **registro sindical no MTE** (carta sindical), com categoria e base territorial descritas. Isso é entidade, não atributo.
- **Unicidade sindical** (CF art. 8º, II): um sindicato por categoria por base territorial. Modele como invariante — é a violação dela que gera o conflito acima.
- Vigência de CCT e data-base **não coincidem** com ano civil nem entre si.

### Tabelas

**Referência (globais, sem `tenant_id`, read-only para a aplicação)**

- `municipality` — código IBGE, nome, UF
- `cnae` — código, descrição, seção

Popule com seed. Município e CNAE são dados públicos; um seed mínimo do ABC paulista e dos CNAEs de comércio já basta para esta fatia.

**Tenancy e IAM**

- `tenant` — sindicato. slug, razão social, CNPJ
- `branch` — unidades. Nunca hardcode Santo André / Mauá / São Caetano / São Bernardo / Diadema; elas entram como seed do tenant SECABC
- `app_user` — vinculada a `auth.users` do Supabase
- `role`, `permission`, `role_permission`, `user_role` — `user_role` carrega o escopo (`own` | `branch` | `department` | `tenant` | `global`) e, quando o escopo é `branch`, o `branch_id`

**Union Domain — o núcleo**

- `economic_category` — categoria econômica (lado patronal)
- `professional_category` — categoria profissional (lado laboral)
- `union_registration` — registro/carta sindical no MTE: número, data, categoria representada, base territorial
- `union_territory` — os municípios que compõem a base territorial de um registro
- `union_representation` — **a entidade central.** Liga tenant ↔ empresa, com:
  - `status`: `reivindicada` | `reconhecida` | `disputada` | `perdida`
  - `valid_from` / `valid_until`
  - `basis`: como foi determinada (`cnae` | `cct_registrada` | `decisao_judicial` | `carta_sindical` | `manual`)
  - `evidence`: descrição e referência documental
  - `decided_by` / `decided_at`
- `collective_agreement` — CCT/ACT: tipo, número no Mediador, vigência início/fim, data-base, categorias e território
- `contribution_rule` — vinculada à CCT, com vigência própria, tipo (`assistencial` | `confederativa` | `mensalidade` | `negocial`), base de cálculo e valor/percentual

  Crie a tabela e o CRUD mínimo, mas **não construa motor de cálculo nem geração de obrigação nesta fatia.** Ela existe aqui para que a resolução consiga responder "sob qual regra", não para cobrar.

**Empresa**

- `company` — CNPJ, razão social, nome fantasia, CNAE principal, município, status
- `establishment` — matriz/filial, CNPJ próprio, CNAE e município próprios

  Atenção: a representação pode divergir entre matriz e filial, porque dependem de município e CNAE. Modele a resolução no nível do estabelecimento e agregue para a empresa.

**Transversais**

- `audit_log` — append-only, com `data_classification`
- `outbox_event` — `tenant_id`, agregado, tipo, payload, `occurred_at`, `published_at`

### A função que importa

```
resolveRepresentation(establishmentId, referenceDate)
  → { representation, agreement, contributionRules, status, basis, evidence, conflicts[] }
```

`conflicts[]` não pode ser vazio por construção: quando houver mais de uma representação vigente para o mesmo estabelecimento, retorne todas e marque o status como disputado. **Não escolha uma silenciosamente.**

---

## Entregáveis

1. **Repositório inicializado** — monorepo conforme seção 45 da fundação, `.gitignore` com `.env*`, `.env.example` só com placeholders, README explicando como rodar
2. **Migrations em SQL** aplicadas no Supabase de DEV
3. **Seed** — tenant SECABC, 5 unidades, roles e permissões, municípios e CNAEs do ABC, 3 empresas de exemplo (uma com representação limpa, uma com histórico de mudança ao longo do tempo, uma disputada)
4. **Camada de autorização** tipada, com a matriz role × permission × scope
5. **API** — CRUD de empresa e estabelecimento, CRUD de representação, e a resolução acima
6. **UI mínima** — login, lista de empresas com busca por CNPJ e razão social, e ficha da empresa mostrando a linha do tempo da representação e a CCT vigente na data escolhida
7. **Testes** conforme abaixo
8. **ADRs** em `decisoes/`: ADR-001 stack, ADR-002 multi-tenancy com FK composta, ADR-008 autorização em app-layer com RLS defensiva. Escreva-os enquanto implementa, não depois

## Definition of Done — os testes precisam passar

**Estrutura (rodando contra o banco)**
- Toda tabela de tenant tem `tenant_id NOT NULL` e `UNIQUE (id, tenant_id)`
- Toda FK entre tabelas de tenant é composta
- RLS habilitada em 100% das tabelas — teste que varre `pg_tables` e falha se achar exceção

**Isolamento**
- Dois tenants populados; nenhuma query de um retorna linha do outro
- Inserir filho referenciando pai de outro tenant **falha no banco**, não na aplicação

**Permissão**
- Matriz automatizada: atendimento com `finance.read` → negado · financeiro → permitido · usuário de Mauá lendo registro de Santo André → negado · tenant A lendo tenant B → negado

**Temporal**
- Duas representações vigentes sobrepostas para o mesmo estabelecimento → rejeitado pela constraint `EXCLUDE`
- Empresa com três representações ao longo do tempo → a resolução retorna a correta para cada data consultada
- Consulta em data anterior a qualquer vigência → retorna vazio, não erro

**Domínio**
- Estabelecimento com duas representações concorrentes → resolução retorna `disputada` e ambas em `conflicts[]`
- Matriz e filial em municípios diferentes → resolvem para representações diferentes

**Eventos e auditoria**
- Criar empresa → `outbox_event` gravado na mesma transação
- Transação revertida → nenhum `outbox_event` órfão
- Leitura de dado classificado como sensível → `audit_log` registra a classificação

**E2E**
- Login → busca por CNPJ → abre ficha → vê representação vigente e CCT na data de hoje → muda a data para 2024 → vê a representação anterior

---

## Onde parar e perguntar

Não decida sozinho, pare e pergunte:

- Se houver duas modelagens defensáveis para `union_representation` (vínculo direto à empresa versus derivação por categoria + território). Traga as duas com o trade-off — essa decisão é estrutural e vira ADR.
- Antes de qualquer dependência fora da stack do `CLAUDE.md`.
- Se o seed exigir dado real do SECABC que você não tem. Invente dado de exemplo claramente fictício e sinalize; não presuma.

## Ordem sugerida

Migrations e testes de estrutura primeiro. Só depois autorização, depois domínio, depois API, depois UI. Não escreva tela antes de o teste de isolamento estar passando — se o isolamento estiver errado, todo o resto é retrabalho.

Comece confirmando o que entendeu e qual será o primeiro commit.
