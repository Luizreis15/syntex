# Syntex — Contexto do Projeto

Plataforma SaaS multi-tenant de gestão sindical. Cliente fundador: Sindicato dos Comerciários do ABC (SECABC). O produto não é um ERP com telas para sindicato — é a infraestrutura que modela a **relação sindical** entre trabalhador, empresa e entidade.

Documentação de fundação em `fundacao/`. Leia `00-INDICE.md` primeiro. O doc `03-triagem-revisao-arquitetural.md` é o mais acionável: ele define o que é irreversível e o que pode esperar.

---

## Regra número um

> **Antes de escrever qualquer coisa, pergunte: isso é necessidade sindical, configuração ou particularidade do SECABC?**
>
> Necessidade sindical → CORE · Varia entre sindicatos → CONFIGURATION · Específico → FEATURE FLAG · **Nunca** → código customizado.

Não existe `if (tenant === 'secabc')` neste código. Em nenhuma hipótese.

---

## Invariantes arquiteturais — não negociáveis

Estes valem para todo código, sempre. Violação é bug, não escolha de estilo.

### 1. Isolamento de tenant

- Toda tabela de tenant tem `tenant_id uuid NOT NULL`.
- Toda tabela de tenant tem `UNIQUE (id, tenant_id)`.
- **Toda FK entre tabelas de tenant é composta:** `FOREIGN KEY (parent_id, tenant_id) REFERENCES parent (id, tenant_id)`. Isso faz o *banco* recusar referência cross-tenant. RLS protege leitura; FK composta protege integridade. As duas coisas são necessárias.
- Tabelas globais (dados de referência: municípios, CNAE) não têm `tenant_id` e são read-only para a aplicação.
- RLS habilitada em **todas** as tabelas, sem exceção.

### 2. Autorização

- **A autorização rica vive na camada de aplicação**, tipada e testável: role → permission → scope (`own` | `branch` | `department` | `tenant` | `global`).
- **RLS carrega apenas o isolamento de tenant.** Simples, barata, e é a garantia que nunca pode falhar. Não replique regra de negócio em policy SQL — regra em dois lugares diverge.
- A aplicação web usa a chave `anon` + JWT do usuário. **Nunca** `service_role`.
- Workers recebem conexão com contexto de tenant explícito. `service_role` genérica fazendo query livre em todos os tenants é proibida.
- `worker.read` não implica `worker.export`. Exportação e operação em massa são permissões próprias.

### 3. Temporalidade

Regras sindicais são temporais por natureza. Uma CCT de 2026 não sobrescreve a de 2025.

- Entidades com vigência usam `valid_from timestamptz NOT NULL` e `valid_until timestamptz NULL` (null = vigente).
- Sobreposição de vigência é impedida no banco com `EXCLUDE USING gist` (requer `btree_gist`).
- **Toda obrigação gerada carrega um snapshot imutável da regra que a originou** (JSONB). Guia emitida precisa ser reproduzível mesmo depois de a regra mudar.

### 4. Eventos e consistência

- Todo write que produz efeito externo grava um `outbox_event` **na mesma transação**. Sem outbox, o evento se perde entre o commit no Postgres e o publish na fila.
- Consumidores são idempotentes. Webhook duplicado nunca gera efeito duplo.

### 5. Auditoria e dado sensível

- **Filiação sindical é dado pessoal sensível pela LGPD** (art. 5º, II). Dado de saúde e jurídico também. Isso não é compliance — é requisito de schema.
- Toda tabela e coluna tem classificação: `publico` | `interno` | `pessoal` | `sensivel` | `financeiro` | `juridico` | `saude`.
- **O audit log registra a classificação do dado acessado.** Sem isso é impossível responder, no prazo de 3 dias úteis da ANPD, quais titulares e quais categorias de dado foram expostos.
- Dado de saúde e jurídico ficam em **tabela separada**, nunca como coluna em `person`. Tabela separada = policy separada = auditoria trivial.
- Audit log é append-only. Sem UPDATE, sem DELETE.

### 6. Migrations

- Todas versionadas em git, em SQL puro. Nunca alteradas manualmente no painel.
- Fluxo: migration → PR → review → staging → produção.

---

## Definition of Done

Uma feature não está pronta quando a tela funciona. Está pronta quando tem:

UX · permissão · validação · migration · audit · evento · testes · tratamento de erro · observabilidade · documentação

---

## Stack

- **Web:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui (Radix como base de primitive, nunca como produto final — ver `design/SYNTEX-UI.md`), React Hook Form, Zod
- **Estado:** TanStack Query (estado de servidor), TanStack Table (`SyntexDataTable`), URL/`searchParams` para filtro e view salva
- **Dados:** Supabase / PostgreSQL, RLS, Storage, Auth
- **Migrations:** SQL puro via Supabase CLI. Não use gerador de migration de ORM — RLS, policies e constraints `EXCLUDE` são mais claros e mais corretos em SQL escrito à mão.
- **Tipos:** gerados do schema (`supabase gen types typescript`)
- **Testes:** Vitest (unit/integration), Playwright (e2e)
- **E-mail:** Resend

Não adicione dependência fora desta lista sem perguntar antes.

---

## O que NÃO construir agora

Resistir explicitamente, mesmo que pareça útil no momento:

- Workflow engine genérico — implemente máquinas de estado concretas primeiro
- Plataforma de integração com circuit breaker e health — defina só a interface da porta; a maquinaria entra no segundo provedor
- Tesouraria / contas a pagar — integrar, não construir
- Portais externos, control plane, camada de IA, model registry
- Abstração para variação que ainda não foi observada duas vezes

Regra: hardcode com fronteira limpa até aparecer a **segunda** evidência de variação. Um `if` isolado atrás de uma interface bem nomeada é mais barato de generalizar depois do que uma engine genérica é de simplificar.

---

## Ambientes e segredos

- O projeto Supabase atual é **DEV**. Produção será um projeto separado. Não aponte código para produção.
- Segredos em `.env.local`, que está no `.gitignore`. `.env.example` só com placeholders.
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são públicas por design — podem ir para o client.
- `SUPABASE_SERVICE_ROLE_KEY` e `RESEND_API_KEY` são secretas. Nunca no client, nunca em commit, nunca em log.

---

## Front-end — lei resumida

A lei completa está em **`design/SYNTEX-UI.md`**. Leia antes de tocar em qualquer tela. O que nunca se esquece:

- **A distinção do Syntex vive na estrutura, não na cor.** As quatro assinaturas: faixa de vigência, barra "Vigência em" como moldura permanente, mono em todo identificador, e dois sistemas de cor separados.
- **`disputada` não é `danger`.** Estado de domínio (situação jurídica) e estado de sistema (funcionou ou não) são conjuntos de cor distintos e não se misturam. Estado nunca é comunicado só por cor.
- **O agente compõe primitives `Syntex*`, não inventa.** É proibido, sem perguntar antes: cor, raio, sombra, espaçamento ou escala fora dos tokens; novo estilo de card ou botão; gradiente; biblioteca visual nova; `shadcn add` com default. Número literal de cor, tamanho ou z-index em componente é bug.
- **Card só com agrupamento semântico real.** Um dado não vira card. Transformar tudo em card é assinatura de template.
- **Piso de legibilidade:** nada abaixo de 11.5px nem de 4.5:1. Quem opera tem 30 anos, quem assina tem 65.
- **Formatação brasileira** (CPF, CNPJ, moeda, data, competência) vive em `lib/formatters`. Nunca à mão num componente.
- **Feature ownership:** cada domínio tem seus componentes, queries, actions, schemas e permissions em `features/<dominio>/`. Nada de pasta global com `CompanyAlgo.tsx` ao lado de `FinanceOutraCoisa.tsx`.
- Server Components por padrão. URL é estado — filtro relevante vai para `searchParams`.
- `<Can permission="...">` na UI, nunca `if (role === ...)`. E UI não é fonte de segurança: a autorização real continua na API e no banco.

---

## Como trabalhar

- **Vertical slice, não camada por camada.** Uma fatia fina que atravessa UX → API → permissão → banco → audit → evento → teste vale mais que um backend completo sem tela.
- **Pare e pergunte** quando: houver duas modelagens defensáveis para uma entidade de domínio; for preciso uma dependência nova; a tarefa exigir decisão de negócio que não está nos docs.
- **Escreva o ADR quando tomar a decisão**, em `decisoes/ADR-NNN-titulo.md`. Não deixe decisão estrutural viver só na memória do commit.
- Commits pequenos e descritivos. Um conceito por commit.
