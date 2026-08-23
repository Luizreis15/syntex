# Syntex — Contexto do Projeto

Plataforma SaaS multi-tenant de gestão sindical. Cliente fundador: Sindicato dos Comerciários do ABC (SECABC). O produto não é um ERP com telas para sindicato — é a infraestrutura que modela a **relação sindical** entre trabalhador, empresa e entidade.

Documentação de fundação arquivada em `_arquivo_fundacao/fundacao/` (não é lei ativa do agente nesta fase).

### Decisão ativa — Modo A (front DEMO / Lovable)

Objetivo imediato: front funcional e **premium**, visualmente igual ou muito próximo das referências Lovable. Nesta fase é **autorizado** mock de UI no Painel / 360 / listagens. Usar seed DEV real quando existir; mock preenche o restante. Freeze visual e `SYNTEX-UI` rígido estão em `_arquivo_design/`.

Invariantes de **backend** (tenant, RLS, auth, LGPD no schema) continuam abaixo. A austeridade visual **não** está ativa.

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

## Front-end — modo DEMO (Lovable)

Referência visual soberana nesta fase: telas Lovable do projeto (`_ref_syntex-vital-core` + screenshots). Tokens/arquivos em `_arquivo_design/` são histórico, não bloqueio.

Prioridades:

- Densidade e acabamento premium (Command Center, Empresa 360, Trabalhador 360)
- Cards, tints, rails, dark surfaces, charts SVG/CSS — autorizados
- Mock de UI marcado com `DEMO UI — substituir por dados reais depois`
- Formatação BR continua em `lib/formatters`
- Feature ownership em `features/<dominio>/`
- `<Can permission="...">` na UI; autorização real permanece na API/banco
- Piso de legibilidade: ≥ 11.5px · contraste legível

Não inventar `if (tenant === 'secabc')`.

---

## Como trabalhar

- **Vertical slice, não camada por camada.** Uma fatia fina que atravessa UX → API → permissão → banco → audit → evento → teste vale mais que um backend completo sem tela.
- **Pare e pergunte** quando: houver duas modelagens defensáveis para uma entidade de domínio; for preciso uma dependência nova; a tarefa exigir decisão de negócio que não está nos docs.
- **Escreva o ADR quando tomar a decisão**, em `decisoes/ADR-NNN-titulo.md`. Não deixe decisão estrutural viver só na memória do commit.
- Commits pequenos e descritivos. Um conceito por commit.
