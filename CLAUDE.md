# Syntex — Contexto do Projeto

Plataforma SaaS multi-tenant de gestão sindical. Cliente fundador: Sindicato dos
Comerciários do ABC (SECABC). O produto modela a **relação sindical** entre
trabalhador, empresa e entidade — não é um ERP genérico.

## Fontes de verdade (duas camadas)

Não confundir **estado atual** com **norma**.

### Implementation truth — “o que existe hoje”

Evidência do produto real, nesta ordem:

1. Schema / migrations aplicadas  
2. Código atual  
3. Testes executáveis  
4. `docs/OPERATIONAL-BASELINE.md` como **mapa consolidado** do estado observado  

O baseline descreve capability status e prioridades.  
**Não** substitui schema/código/testes como evidência do que está implementado.

### Normative truth — “como o produto deve funcionar”

Regras vigentes, nesta ordem:

1. Decisão explícita do Product Owner  
2. ADR mais recente e **aplicável ao assunto**  
3. Este `CLAUDE.md` / invariantes ativos  
4. Documentação operacional complementar (baseline, freeze frontend, etc.)  

Código que diverge de um ADR aplicável **não** invalida o ADR.  
Isso é um **GAP**: registrar e resolver explicitamente (slice/ADR), não “seguir o código”.

### Histórico

`_arquivo_fundacao/` e `_arquivo_design/` = histórico/contexto.  
Não são norma vigente, salvo referência explícita de documento ativo.  
Auditorias em `docs/audits/` não são norma.

---

### Decisão ativa — Fase Operacional (Operational Core v1)

**ADR-020.** Frontend premium aprovado e congelado (`d31dcc1` + freeze `3409cdc`).  
Prioridade: vertical slices de domínio real. **Não** redesenhar shell/painel/360
incidentalmente. Modo A (ADR-018) encerrou o redesign global.

Mapa do produto: `docs/OPERATIONAL-BASELINE.md`.  
Próximo domínio de produto: **Representação sindical**.

---

## Regra número um

> **Antes de escrever qualquer coisa, pergunte: isso é necessidade sindical,
> configuração ou particularidade do SECABC?**
>
> Necessidade sindical → CORE · Varia entre sindicatos → CONFIGURATION ·
> Específico → FEATURE FLAG · **Nunca** → código customizado.

Não existe `if (tenant === 'secabc')` neste código. Em nenhuma hipótese.

---

## Invariantes arquiteturais — não negociáveis

Estes valem para todo código, sempre. Violação é bug, não escolha de estilo.

### 1. Isolamento de tenant

- Toda **tabela de tenant** tem `tenant_id uuid NOT NULL`.
- Toda tabela de tenant tem `UNIQUE (id, tenant_id)`.
- **Toda FK entre tabelas de tenant é composta:**
  `FOREIGN KEY (parent_id, tenant_id) REFERENCES parent (id, tenant_id)`.
- Tabelas globais (municípios, CNAE) não têm `tenant_id` e são read-only para a app.
- RLS habilitada em **todas** as tabelas, sem exceção.
- **Exceção nominal (ADR-019):** `platform_notification` é **control-plane-scoped**.
  `tenant_id` é filtro/contexto opcional (`NULL` = global do CP), **não** ownership.
  Nullable `tenant_id` em outras tabelas **não** é permitido sem ADR + allowlist
  `control_plane_nullable_tenant_allowlist()`.

### 2. Autorização

- **A autorização rica vive na camada de aplicação**, tipada e testável:
  role → permission → scope (`own` | `branch` | `department` | `tenant` | `global`).
- **RLS carrega apenas o isolamento de tenant.**
- A aplicação web usa a chave `anon` + JWT do usuário. **Nunca** `service_role`
  no client. Control plane usa admin client **só** após `getPlatformSession`.
- Workers recebem conexão com contexto de tenant explícito.
- `worker.read` não implica `worker.export`.

**Padrão real de permission no código (não existe `<Can permission>`):**

| Camada | Mecanismo |
|--------|-----------|
| API | `requireSession` + `checkPermission` / `can` |
| Pages RSC | `hasAnyGrant` / `getPlatformSession` / actors de portal |
| Nav | `can` / `filterNavSections` em `nav-config.ts` |

Gate de UI **não** substitui autorização no server + RLS.

### 3. Temporalidade

- Entidades com vigência: `valid_from` / `valid_until` (null = vigente).
- Sobreposição impedida com `EXCLUDE USING gist` (`btree_gist`).
- Obrigação gerada carrega **snapshot imutável** da regra (JSONB).

### 4. Eventos e consistência

- Write com efeito externo → `outbox_event` na mesma transação.
- Consumidores idempotentes.

### 5. Auditoria e dado sensível

- Filiação sindical = dado sensível (LGPD). Saúde/jurídico em tabelas separadas.
- Classificação de dados; audit log append-only; classificação no acesso.

### 6. Migrations

- SQL puro versionado em git. Nunca editar migration histórica aplicada.
- Fluxo: migration → PR → review → staging → produção.

---

## Definition of Done

UX · permissão · validação · migration · audit · evento · testes · erro ·
observabilidade · documentação

---

## Stack

- **Web:** Next.js (App Router), TypeScript, Tailwind, primitives Syntex (Radix
  só como base), React Hook Form, Zod (`@syntex/validation`)
- **Estado:** TanStack Query / Table; URL `searchParams` para filtro
- **Dados:** Supabase / PostgreSQL, RLS, Storage, Auth
- **Migrations:** SQL via Supabase CLI
- **Tipos:** `supabase gen types typescript`
- **Testes:** Vitest · Playwright (e2e ainda fino)
- **E-mail:** Resend

Não adicione dependência fora desta lista sem perguntar antes.

**Design system:** tokens e lei visual histórica em `_arquivo_design/`
(`SYNTEX-UI-v2.1.md`). O **baseline visual aprovado** é o código em `d31dcc1`
+ `docs/FRONTEND-APPROVED-BASELINE.md` + **ADR-020**. Não redesenhar shell,
topbar, sidebar, tokens globais ou linguagem visual em slices operacionais
sem aprovação explícita do PO.

---

## O que NÃO construir agora

Resistir explicitamente:

- Workflow engine genérico — máquinas de estado concretas primeiro
- Plataforma de integração com circuit breaker/health prematura
- Tesouraria / contas a pagar — integrar, não construir
- **Syntex Intelligence / camada operacional de IA** não faz parte do Operational
  Core atual e **não deve ser expandida incidentalmente** (só após processos reais
  suficientes e decisão explícita). Model registry prematuro: evitar.
- Abstração para variação observada uma única vez

### Já existentes — não “construir do zero”; não expandir sem slice

| Superfície | Estado |
|------------|--------|
| Portais `/associado`, `/empresa`, `/escritorio` | **Já fazem parte da arquitetura** |
| Control plane `/platform` | **Já existe** (tenants, cobranças, notificações, gateway) |

Expandir portais ou control plane só com vertical slice explícito.

Regra: hardcode com fronteira limpa até a **segunda** evidência de variação.

---

## Ambientes e segredos

- Supabase atual = **DEV**. Produção = projeto separado.
- Segredos em `.env.local` (gitignored). `.env.example` só placeholders.
- `NEXT_PUBLIC_*` Supabase = públicos por design.
- `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY` = secretas. Nunca no client/commit/log.

---

## Front-end na fase operacional

- Baseline congelado: ver ADR-020 e `docs/FRONTEND-APPROVED-BASELINE.md`.
- Novos módulos **reutilizam** Visual System e patterns existentes.
- Blocos **DEV_DEMO** já identificados (Painel / 360s) podem permanecer até
  slice de substituição; **não** criar novos DEMOs silenciosos em capabilities
  operacionais.
- Taxonomia: `REAL` | `DEV_DEMO` | `NOT_IMPLEMENTED` | `PLANNED`
  (definições em `docs/OPERATIONAL-BASELINE.md`). **Seed ≠ mock**
  (seed = dado persistido no modelo real).
- Formatação BR: `lib/formatters`. Features: `features/<dominio>/`.
- Nav: `built:true` / `built:false` (ADR-017). Atendimento → `/filiacao` é
  **placeholder** (`NOT_IMPLEMENTED`) — corrigir em Slice 0.3; não alterar nav
  neste documento.

Não inventar `if (tenant === 'secabc')`.

---

## Como trabalhar

- **Vertical slice**, não camada por camada.
- Pare e pergunte em modelagem ambígua, dependência nova, ou decisão de negócio
  ausente dos docs.
- Toda decisão estrutural → ADR em `decisoes/ADR-NNN-titulo.md`.
- Commits pequenos; um conceito por commit.
- Ordem de construção: ver `docs/OPERATIONAL-BASELINE.md` (WAVEs 0–6).
