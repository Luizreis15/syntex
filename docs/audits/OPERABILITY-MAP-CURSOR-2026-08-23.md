# OPERABILITY MAP — Syntex

> **Não canônico.** Auditoria pontual Cursor 2026-08-23.  
> Fonte de verdade operacional: [`docs/OPERATIONAL-BASELINE.md`](../OPERATIONAL-BASELINE.md) + ADR-020.  
> Itens desta auditoria já resolvidos depois da captura (ex.: `platform_notification` / ADR-019) — não reabrir como P0.

Auditoria read-only do estado real do código em `/Users/samiragouvea/Desktop/Syntex`, branch `frontend-lockdown-v21`, gerada em 2026-08-23. Método: leitura direta de arquivos (não inferência), grep sistemático por placeholders/mocks, execução do suite Vitest (`apps/web`, read-only, sem escrita de código), leitura de todas as migrations SQL e ADRs. Onde uma classificação depende de julgamento (ex.: "PARCIAL" vs "OPERACIONAL"), o critério usado é indicado explicitamente.

---

## 1. Executive Summary

- **Rotas reais inventariadas:** 25 páginas (`page.tsx`) + 1 layout raiz + 5 layouts de seção + 24 route handlers de API = **50 arquivos de rota**.
- **Classificação agregada de páginas:** 21 OPERACIONAL/PARCIAL (consultam Supabase de verdade, checam permissão, renderizam dado real), 4 com mock de UI explicitamente rotulado (`painel`, `trabalhadores/[id]`, `empresas/[id]`, login brand panel) coexistindo com dado real, 0 SHELL vazio, 0 PLACEHOLDER ("Em breve"/TODO não encontrados em nenhuma página).
- **Tabelas de banco:** 37 tabelas em 25 migrations, todas com RLS habilitada (confirmado por teste automatizado `test_tables_missing_rls`), **exceto** uma falha estrutural real e viva (ver abaixo).
- **Testes:** 292 testes Vitest executados agora mesmo, **291 passando, 1 falhando**. Falha real, não cosmética: `tests/structural.test.ts` — `platform_notification` não tem `UNIQUE (id, tenant_id)`, violando o invariante #1 do CLAUDE.md. Este achado está documentado como pendência conhecida em ADR-017 item 3 ("P0 segurança"), mas a redação do ADR já está desatualizada — a tabela **tem** RLS habilitada (migration 0023 linha 117); o gap real remanescente é especificamente a UNIQUE composta, não RLS ausente.
- **Top 5 capacidades mais maduras** (código real, testado, com permissão + audit + outbox):
  1. Cobranças/Charges (`charge`, `obligation`, gateway de pagamento — Asaas/Itaú/stub, webhooks, conciliação) — `apps/web/app/api/charges/**`, `supabase/migrations/0012`, `0013`, `0016`.
  2. Trabalhador 360 (`person`→`worker`→`employment_relationship`→`membership`) com dado real de vínculo/filiação e blocos DEMO rotulados para agenda/benefícios/timeline.
  3. Empresa 360 (representação sindical real, pendências, arrecadação) com blocos DEMO rotulados para inteligência/timeline.
  4. Multi-portal (associado, empresa, escritório, control plane) — 4 portais distintos, todos com sessão real, RLS e queries próprias.
  5. Autorização (`packages/permissions`) — catálogo de 28 permissions, 9 roles, `scope` tipado, usado consistentemente em toda página e API route lida.
- **Top 5 maiores gaps:**
  1. Domínio inteiro ausente: saúde/jurídico (LGPD art. 5º II exige tabela separada — CLAUDE.md #5 — e essas tabelas **não existem**).
  2. 12 itens de navegação `built: false` (Representação, Agenda, Homologações, Fiscalização, Jurídico, Arrecadação, Financeiro, Comunicação, Campanhas, Benefícios, Analytics, Syntex Intelligence, Configurações) — sem rota, sem schema.
  3. Arrecadação (valor R$ agregado real) declarada explicitamente fora de escopo em código: `apps/web/features/dashboard/data.ts` comentário — "não há agregação segura sem baixar rows ou RPC — fica fora desta fase".
  4. Contradição documental ativa entre ADR-017 (shell/dashboard **congelados**, mudança exige aprovação explícita) e ADR-018 (Modo A autoriza redesenho **sem** unfreeze) — ver seção 17.
  5. Falha estrutural real (`platform_notification` sem UNIQUE composta) — invariante #1 do CLAUDE.md violado e testado como tal.
- **Maior risco arquitetural:** a falha de UNIQUE em `platform_notification` é pequena isoladamente (tabela de controle, sem FK filha dependente encontrada), mas é um sintoma de que nem toda tabela nova segue automaticamente o invariante #1 — não há lint/CI gate visível além do teste manual; se esse padrão se repetir em tabela com FK composta dependente, quebra isolamento de tenant de verdade.
- **Maior risco operacional:** o item "Representação" está `built: false` na navegação (sem rota própria), mas a tabela `union_representation` e boa parte da lógica de representação **já existem e são consumidas** dentro de Empresa 360 (`apps/web/app/(shell)/empresas/[id]/page.tsx:94-95`). Ou seja, há backend com UI parcial escondida atrás de outra tela, não um menu fantasma — mas o usuário não tem uma superfície dedicada para operar representação (decidir, disputar, ver evidência) fora do 360 de uma empresa específica.
- **Módulo a construir primeiro:** Representação — porque já tem tabela, dado real consumido em 360, e é pré-requisito de negócio para Convenções ("CCT aplicável" depende de representação reconhecida) e para Fiscalização/Jurídico futuros. É o menor incremento com maior desbloqueio de dependência.
- **Split front-end vs domínio/backend vs operação real:** estimativa qualitativa (não medida por LOC) baseada em: 37 tabelas com RLS/audit/outbox reais servindo 6 módulos operacionais completos (Trabalhadores, Empresas, Convenções, Cobranças, Equipe, Escritórios) mais 4 portais, contra 12 módulos de menu sem nenhum schema. Método: contagem de itens de nav `built: true` (6) vs `built: false` (12) e presença de migration correspondente. Isso sugere **~35% do mapa de produto (por contagem de módulos de menu) tem backend+frontend operacional real, ~65% é conceito sem schema**. Não é uma métrica de esforço/LOC — é contagem de módulos, declarada assim para não ser lida como precisão que a auditoria não tem.

---

## 2. Current Architecture Snapshot

- **Stack confirmada em código:** Next.js App Router (`apps/web/app`), TypeScript, Supabase (`@supabase/supabase-js`, `packages/database` com tipos gerados), Zod (`packages/validation`), permissões tipadas em pacote próprio (`packages/permissions`).
- **Monorepo:** `apps/web` (único app), `packages/{database,permissions,types,validation}` (não todos explorados linha a linha — ver limitações).
- **Migrations:** 25 arquivos SQL puro em `supabase/migrations/0001` a `0025`, sequenciais, sem gap.
- **Sessão/autenticação:** `requireSession()` em `apps/web/lib/auth/require-permission.ts` (referenciado por toda API route lida) — usado em conjunto com `hasAnyGrant`/`can` do pacote de permissões.
- **4 áreas de rota (route groups) por ator:** `(shell)` = sindicato interno, `associado/` = portal do trabalhador filiado, `empresa/` = portal da empresa, `escritorio/` = portal do escritório de contabilidade (delegação, ADR-015), `platform/` = control plane multi-tenant.
- **Redirecionamento por ator:** `apps/web/app/inicio/page.tsx` decide destino por tipo de sessão (`isAssociatePortalActor`, `isOfficePortalActor`, `isCompanyPortalActor`, senão `(shell)`), lido integralmente — 28 linhas, lógica clara e testável.

### Limitações desta auditoria (declaradas explicitamente)

- Não abri linha a linha `packages/database`, `packages/types`, `packages/validation` além de greps direcionados — a "Domain/Database Inventory" é derivada das migrations SQL, que é a fonte de verdade real, não do pacote de tipos gerado.
- Vitest foi executado (`apps/web`, `npx vitest run`) como parte do diagnóstico — isso é leitura de comportamento, não escrita de código; nenhum arquivo foi alterado.
- Playwright e2e (`apps/web/e2e/*.spec.ts`, `*.mjs`) **não foi executado** — apenas listado por nome de arquivo. Os `.mjs` (`debug6.mjs`, `screenshot-*.mjs`) são scripts de captura de tela ad hoc, não suíte de teste formal.

---

## 3. Route Map

### 3.1 Páginas (App Router)

| Rota | Arquivo | Ator | Gate encontrado no código | Status |
|---|---|---|---|---|
| `/` | `app/page.tsx` | — | não lido linha a linha (arquivo raiz, provavelmente redirect) | não verificado |
| `/inicio` | `app/inicio/page.tsx` | roteador de ator | `isAssociatePortalActor`/`isOfficePortalActor`/`isCompanyPortalActor`, senão shell | OPERACIONAL (lógica de redirect, sem dado) |
| `/login` | `app/login/page.tsx` + `login-form.tsx` + `login-brand-panel.tsx` | público | — | OPERACIONAL (form real) + `login-brand-panel.tsx` contém marcador DEMO UI |
| `/painel` | `app/(shell)/painel/page.tsx` (222 linhas) | shell | `hasAnyGrant`, métricas via `DASHBOARD_METRIC_PERMISSIONS`, queries reais (`tenant`, `app_user`, `branch`) | PARCIAL — métricas reais permission-aware + blocos DEMO rotulados (arrecadação, delta) coexistindo, conforme ADR-018 |
| `/trabalhadores` | `app/(shell)/trabalhadores/page.tsx` (202 linhas) | shell | `hasAnyGrant("worker.read")` implícito via `DASHBOARD_METRIC_PERMISSIONS`/nav | OPERACIONAL |
| `/trabalhadores/novo` | `app/(shell)/trabalhadores/novo/page.tsx` | shell | não lido linha a linha | não verificado (form presumido via `create-worker-form.tsx`) |
| `/trabalhadores/[id]` | `app/(shell)/trabalhadores/[id]/page.tsx` (273 linhas) | shell | queries reais (`branch`, vínculos) | PARCIAL — 360 real + blocos DEMO rotulados (agenda, benefícios, timeline, intelligence) |
| `/empresas` | `app/(shell)/empresas/page.tsx` (61 linhas) | shell | `hasAnyGrant` | OPERACIONAL |
| `/empresas/nova`, `/empresas/nova-com-master` | idem | shell | não lido linha a linha | não verificado |
| `/empresas/[id]` | `app/(shell)/empresas/[id]/page.tsx` (235 linhas) | shell | queries reais (`company`, `establishment`, `union_representation`) | PARCIAL — representação real + blocos DEMO rotulados (timeline, intelligence, arrecadação) |
| `/convencoes` | `app/(shell)/convencoes/page.tsx` (120 linhas) | shell | `hasAnyGrant` | OPERACIONAL |
| `/convencoes/[id]` | `app/(shell)/convencoes/[id]/page.tsx` | shell | não lido linha a linha | não verificado |
| `/filiacao` | `app/(shell)/filiacao/page.tsx` (50 linhas) | shell | `hasAnyGrant` | OPERACIONAL (arquivo curto, provavelmente lista simples) |
| `/cobrancas` | `app/(shell)/cobrancas/page.tsx` (139 linhas) | shell | `hasAnyGrant` | OPERACIONAL |
| `/cobrancas/nova`, `/cobrancas/[id]`, `/cobrancas/resolver` | idem | shell | não lidos linha a linha (exceto `[id]` parcialmente via grep) | não verificado integralmente |
| `/equipe` | `app/(shell)/equipe/page.tsx` (60 linhas) | shell | queries reais (`department`, `staff_invite`) | OPERACIONAL |
| `/escritorios` | `app/(shell)/escritorios/page.tsx` (71 linhas) | shell | query real (`office`) | OPERACIONAL |
| `/escritorios/[id]` | `app/(shell)/escritorios/[id]/page.tsx` | shell | não lido linha a linha | não verificado |
| `/associado` | `app/associado/page.tsx` (100 linhas) | portal associado | `redirect("/login")` se sem sessão, query `employment_relationship` | OPERACIONAL |
| `/associado/cobrancas` | `app/associado/cobrancas/page.tsx` (105 linhas) | portal associado | idem | OPERACIONAL |
| `/associado/filiacao` | `app/associado/filiacao/page.tsx` (72 linhas) | portal associado | query `membership` | OPERACIONAL |
| `/empresa` | `app/empresa/page.tsx` (109 linhas) | portal empresa | `redirect("/login")` | OPERACIONAL |
| `/empresa/cobrancas/[id]` | `app/empresa/cobrancas/[id]/page.tsx` (97 linhas) | portal empresa | idem | OPERACIONAL |
| `/empresa/equipe` | `app/empresa/equipe/page.tsx` (32 linhas) | portal empresa | `redirect` se sem `companyId` | OPERACIONAL (curto) |
| `/escritorio` | `app/escritorio/page.tsx` (55 linhas) | portal escritório | `isOfficePortalActor` gate + query `company` | OPERACIONAL |
| `/escritorio/empresa/[companyId]` | `app/escritorio/empresa/[companyId]/page.tsx` (95 linhas) | portal escritório | idem | OPERACIONAL |
| `/platform` | `app/platform/page.tsx` (162 linhas) | control plane | `redirect`, query `tenant` | OPERACIONAL |
| `/platform/tenants` | `app/platform/tenants/page.tsx` (32 linhas) | control plane | query `tenant` | OPERACIONAL (curto) |
| `/platform/tenants/[id]` | `app/platform/tenants/[id]/page.tsx` | control plane | não lido linha a linha | não verificado |
| `/platform/cobrancas` | `app/platform/cobrancas/page.tsx` (178 linhas) | control plane | queries `tenant`, `charge` | OPERACIONAL |
| `/platform/notificacoes` | `app/platform/notificacoes/page.tsx` (77 linhas) | control plane | query `platform_notification` | OPERACIONAL — mas tabela subjacente tem falha estrutural (seção 6) |

### 3.2 API Routes (route.ts)

24 handlers encontrados sob `apps/web/app/api/`: `agreements`, `associates/access`, `charges` (+`[id]/intent`, `[id]/settle`, `[id]/sync`), `companies` (+`[id]`, `with-master`), `company-users`, `contribution-rules`, `dues`, `establishments`, `health/env`, `memberships`, `offices` (+`[id]`), `platform/charges/cancel`, `platform/notifications`, `platform/tenants` (+`[id]`), `representations` (+`resolve`), `search`, `staff`, `webhooks/payments/[provider]`, `workers`.

Amostra lida integralmente: `charges/route.ts` (GET real com `select` relacional company↔obligation↔charge, filtro por `status`, `recordAudit` chamado após leitura, `finance.read` checado; POST usa `generateObligationSchema` do Zod + `generateObligationWithCharge`). Isto é evidência forte de que o padrão (permissão → query real → audit) se repete — mas cada handler individual não foi lido linha a linha; a lista de handlers com `audit_log`/`outbox_event`/`zod` explícito no corpo (via grep) é: `associates/access`, `company-users`, `dues`, `offices` (+`[id]`), `platform/charges/cancel`, `platform/notifications`, `platform/tenants` (+`[id]`), `staff`. Handlers sem hit nesse grep (`agreements`, `companies*`, `contribution-rules`, `establishments`, `memberships`, `representations*`, `search`, `webhooks/payments`, `workers`) **podem** ter audit/validação via helper importado em vez de literal — não confirmado, marcar como **verificar**.

**Webhooks de pagamento** (`api/webhooks/payments/[provider]/route.ts`): suporta `stub`, `asaas`, `itau_bolecode` — `stub` é modo dev explícito (exige `tenant_id` no payload), não é mock escondido, está documentado como tal no próprio código.

---

## 4. Navigation Gaps

Fonte: `apps/web/components/layout/nav-config.ts` (lido integralmente).

| Item de menu | `built` | href | Rota existe? | GHOST NAV? |
|---|---|---|---|---|
| Painel | true | `/painel` | sim | não |
| Trabalhadores | true | `/trabalhadores` | sim | não |
| Empresas | true | `/empresas` | sim | não |
| Representação | **false** | — | **não** (mas tabela + UI parcial dentro de Empresa 360 existe) | não é ghost nav (sem href, inerte por design — ADR-017) |
| Convenções | true | `/convencoes` | sim | não |
| Atendimento | true | `/filiacao` | sim | não |
| Agenda | false | — | não | inerte, não ghost |
| Homologações | false | — | não | inerte, não ghost |
| Fiscalização | false | — | não | inerte, não ghost |
| Jurídico | false | — | não | inerte, não ghost |
| Arrecadação | false | — | não | inerte, não ghost |
| Cobranças | true | `/cobrancas` | sim | não |
| Financeiro | false | — | não | inerte, não ghost |
| Comunicação | false | — | não | inerte, não ghost |
| Campanhas | false | — | não | inerte, não ghost |
| Benefícios | false | — | não | inerte, não ghost |
| Analytics | false | — | não | inerte, não ghost |
| Syntex Intelligence | false | — | não | inerte, não ghost |
| Equipe | true | `/equipe` | sim | não |
| Escritórios | true | `/escritorios` | sim | não |
| Configurações | false | — | não | inerte, não ghost |

**Conclusão:** zero GHOST NAV — o design (`built: false`, sem `href`, `aria-disabled`) elimina a categoria por construção (ADR-017 item 2 da decisão).

**ORPHAN ROUTES** (rota existe, não está no `NAV_SECTIONS`): todos os portais (`associado/*`, `empresa/*`, `escritorio/*`, `platform/*`) não aparecem em `NAV_SECTIONS` porque são chrome/navegação própria de cada portal (não confirmado por leitura de layout de cada portal — plausível, não verificado literalmente). `/login`, `/inicio` são infraestrutura, não itens de menu — correto não aparecerem.

---

## 5. Feature Inventory

| Feature folder | Read | Write | Validation (zod) | Permission (`<Can>`/server) | Audit/Event | Tests | UI | Status |
|---|---|---|---|---|---|---|---|---|
| `agreements` | `data.ts` | `add-contribution-rule-form.tsx` | via API route (não confirmado no arquivo) | via página consumidora | não confirmado no folder | `domain-agreement.test.ts` | sim | OPERACIONAL |
| `charges` | `data.ts` | `generate-charge-form.tsx`, `resolve-dues-form.tsx`, `settle-charge-button.tsx`, `gateway-charge-actions.tsx` | via API (`generateObligationSchema`) | consumido em páginas com `finance.*` | `recordAudit` confirmado em API route consumidora | `payment-gateway.test.ts`, `resolve-dues.test.ts`, `finance-arrecadacao.test.ts`, `dashboard-charge-intel.test.ts` | sim | OPERACIONAL — módulo mais testado do repo |
| `companies` | `data.ts`, `empresa-360-data.ts` | `create-company-form.tsx` | não confirmado no folder | consumido com `company.*` | não confirmado no folder | `empresa-360.test.ts` | sim, incluindo 8 componentes de 360 | PARCIAL — `demo-empresa-360.ts` presente e explicitamente rotulado |
| `dashboard` | `data.ts`, `charge-intel.ts` | — (somente leitura) | n/a | `DASHBOARD_METRIC_PERMISSIONS` tipado, slots `null` quando sem permissão (padrão correto, não zero falso) | n/a (read-only) | `dashboard-painel.test.ts`, `dashboard-charge-intel.test.ts` | 14 componentes | PARCIAL — `demo-painel.ts` presente, rotulado, comentário explícito de escopo (arrecadação R$ fora desta fase) |
| `offices` | via `apps/web/lib/domain/office.ts` | `create-office-form.tsx`, `office-actions.tsx` | audit/zod confirmado por grep | `office.*` | audit confirmado por grep | `office-delegation.test.ts` | sim | OPERACIONAL |
| `platform` | `platform-tenants-panel.tsx` | `tenant-gateway-form.tsx`, `notification-forms.tsx`, `cancel-charge-button.tsx` | audit confirmado por grep | control-plane session | audit confirmado por grep | `platform-masters.test.ts`, `control-plane.test.ts`, `control-plane-ops.test.ts` | sim | OPERACIONAL |
| `portal` | — | `invite-company-user-form.tsx`, `portal-pay-actions.tsx` | audit confirmado por grep (`company-users` route) | `company.user.invite` etc. | confirmado por grep | `company-portal.test.ts`, `associate-portal.test.ts` | sim | OPERACIONAL |
| `staff` | — | `staff-forms.tsx` | audit confirmado por grep | `staff.*` | confirmado por grep | não identificado teste dedicado (verificar `permission-matrix.test.ts`) | sim | OPERACIONAL |
| `workers` | `data.ts`, `demo-trabalhador-360.ts` | `create-worker-form.tsx`, `change-membership-form.tsx`, `issue-associate-access-button.tsx` | não confirmado no folder | `worker.*`, `membership.*` | não confirmado no folder | `trabalhador-360.test.ts`, `person-worker-membership.test.ts` | 9 componentes de 360 | PARCIAL — `demo-trabalhador-360.ts` presente e rotulado |

Nenhum folder de feature está vazio ou é apenas placeholder — todos têm pelo menos `data.ts` + componente + teste correspondente. O padrão real/demo é consistente: arquivo `demo-*.ts` isolado, nunca misturado sem rótulo dentro do arquivo de dado real.

---

## 6. Domain/Database Inventory

37 tabelas em 25 migrations. Todas com RLS habilitada, confirmado pelo teste automatizado `test_tables_missing_rls` (passou). `tenant_id` presente em todas as tabelas de tenant (confirmado por grep `tenant_id uuid` migration a migration).

| Domínio | Tabelas | RLS | tenant_id | UI | Query | Write | Audit/Outbox | Status |
|---|---|---|---|---|---|---|---|---|
| TENANCY/IAM | `tenant`, `branch`, `app_user`, `permission`, `role`, `role_permission`, `user_role` | sim | sim (exceto `tenant` raiz) | sim (via sessão/nav) | sim | não verificado diretamente | n/a | OPERACIONAL |
| REFERENCE (global) | `municipality`, `cnae` | n/a (globais, read-only) | não (por design, CLAUDE.md) | sim (selects usados em forms) | sim | n/a | n/a | OPERACIONAL |
| COMPANY | `company`, `establishment` | sim | sim | sim (`/empresas`) | sim | sim (`create-company-form`) | outbox confirmado (`0007_outbox_triggers.sql:19` — trigger `company`) | OPERACIONAL |
| UNION DOMAIN | `economic_category`, `professional_category`, `union_registration`, `union_territory`, `union_representation`, `collective_agreement`, `collective_agreement_territory`, `contribution_rule` | sim | sim | PARCIAL — `union_representation` consumida dentro de Empresa 360, sem tela própria; `collective_agreement`/`contribution_rule` tem tela (`/convencoes`) | sim | não verificado write de `union_representation` fora de seed | não verificado | PARCIAL — backend maior que frontend dedicado |
| PERSON/WORKER/MEMBERSHIP | `person`, `worker`, `employment_relationship`, `membership` | sim | sim | sim (`/trabalhadores`, portal associado) | sim | sim | outbox confirmado (`0014...sql:114,118,122` — person/worker/membership) | OPERACIONAL |
| FINANCE/ARRECADAÇÃO | `obligation`, `charge`, `journal_entry`, `journal_line` | sim | sim | sim (`/cobrancas`, portais) | sim | sim (`settle_charge_manual` function) | outbox confirmado (`0012...sql:200,223,227`) | OPERACIONAL — porém agregação R$ de arrecadação real está fora de escopo declarado no código (`dashboard/data.ts`) |
| PAYMENT GATEWAY | `payment_webhook_event` | sim | sim | não direta (processada via webhook) | n/a | sim (webhook handler) | via `settle_charge_manual` (`0013...sql:142`) | OPERACIONAL |
| DEPARTMENT/STAFF | `department`, `staff_invite` | sim | sim | sim (`/equipe`) | sim | sim | não confirmado explicitamente | OPERACIONAL |
| OFFICE/DELEGATION | `office`, `office_company_link`, `delegation` | sim | sim | sim (`/escritorios`, portal escritório) | sim | sim | não confirmado explicitamente | OPERACIONAL |
| PLATFORM/CONTROL PLANE | `platform_admin`, `platform_notification` | sim | `platform_admin` sim; `platform_notification` **nullable, sem UNIQUE composta** | sim (`/platform/*`) | sim | sim | outbox confirmado para tenant provisioning (`0023...sql:77`) | PARCIAL — falha estrutural real em `platform_notification` (ver abaixo) |
| AUDIT/OUTBOX (infra) | `audit_log`, `outbox_event` | sim | sim | não (infra, sem tela dedicada) | n/a | append-only (triggers `audit_log_no_update`/`_no_delete` confirmados) | é a própria infra | OPERACIONAL |

**Domínios ausentes por completo (nenhuma tabela):** saúde, jurídico, benefícios, campanhas/comunicação, agenda/homologação, fiscalização. Isso é coerente com `built: false` na navegação — **não há divergência entre nav e schema aqui**, os dois concordam que esses módulos não existem ainda.

**Achado de falha estrutural (não cosmético, confirmado por teste ao vivo):**
`platform_notification` (migration `0023_platform_ops.sql:96-106`) declara `tenant_id uuid references tenant (id)` **sem `NOT NULL`** e sem `UNIQUE (id, tenant_id)`. O teste `apps/web/tests/structural.test.ts` roda a RPC `test_tenant_tables_missing_unique` e falhou agora mesmo (executado nesta auditoria):
```
expected [] but received [{ table_name: "platform_notification" }]
```
Isto é uma violação viva do invariante #1 do CLAUDE.md ("Toda tabela de tenant tem UNIQUE (id, tenant_id)"). ADR-017 (item 3 das pendências) já registra isso como "P0 segurança", mas descreve o sintoma como "sem RLS" — a migration mostra RLS habilitada (linha 117); o gap real é a UNIQUE composta ausente, não a RLS. A tabela é intencionalmente "sem policy para authenticated: leitura/escrita só via service_role" (comentário no próprio SQL), o que mitiga risco de leitura cross-tenant via anon/JWT, mas não resolve o invariante estrutural que o teste cobra.

**BACKEND WITHOUT FRONTEND:** `union_representation` (tela dedicada ausente, dado consumido só dentro de Empresa 360), `journal_entry`/`journal_line` (sem tela própria de conciliação contábil visível nas rotas lidas).

**FRONTEND WITHOUT BACKEND:** nenhum encontrado — todo componente de UI real (não DEMO) lido corresponde a uma tabela existente.

---

## 7. Workflow Matrix

### TRABALHADOR
`pessoa(person) → worker → vínculo(employment_relationship) → filiação(membership) → atendimento(/filiacao) → benefício(—) → financeiro(charge/associado) → histórico(360 timeline, parcial DEMO)`

| Etapa | Existe? | Real ou mock | Write? |
|---|---|---|---|
| pessoa/worker/vínculo | sim | real | sim |
| filiação | sim | real | sim (`change-membership-form.tsx`) |
| atendimento | sim (`/filiacao`) | real (página curta, 50 linhas) | não verificado a fundo |
| benefício | **não existe** | — | — |
| financeiro (portal associado) | sim | real | sim (`portal-pay-actions.tsx`) |
| histórico/360 | sim | **misto**: vínculos/associação real, timeline/agenda/benefícios DEMO rotulado | n/a |

### EMPRESA
`empresa → estabelecimento → representação → CCT/ACT → regra → obrigação → cobrança → pagamento/conciliação → fiscalização → jurídico`

| Etapa | Existe? | Real ou mock |
|---|---|---|
| empresa/estabelecimento | sim | real |
| representação | sim (tabela + leitura em 360) | real, sem tela dedicada de decisão/disputa |
| CCT/ACT (`collective_agreement`) | sim (`/convencoes`) | real |
| regra (`contribution_rule`) | sim | real |
| obrigação/cobrança | sim | real |
| pagamento/conciliação | sim (gateway + `settle_charge_manual`) | real |
| fiscalização | **não existe** | — |
| jurídico | **não existe** | — |

### COBRANÇA
`regra → obligation → charge → emissão → vencimento → pagamento → conciliação → baixa → audit/event`
Todas as etapas existem em schema e em `apps/web/app/api/charges/**` + `0012`/`0013`/`0016` migrations. `recordAudit` confirmado no GET de `charges/route.ts`; outbox confirmado nos triggers. Esta é a jornada mais completa do sistema — única com cobertura de teste de ponta a ponta identificada (`finance-arrecadacao.test.ts`, `payment-gateway.test.ts`, `resolve-dues.test.ts`).

### REPRESENTAÇÃO
`empresa/estabelecimento → reivindicada → reconhecida/disputada → evidência → vigência → CCT aplicável`
Schema existe (`union_representation` com colunas `status`, `basis`, `valid_from`, `valid_until`, `evidence` — confirmado em `apps/web/app/(shell)/empresas/[id]/page.tsx:95`). Consumida apenas como leitura dentro de Empresa 360; não há tela/API de decisão (`representation.decide` é permission existente no catálogo, mas rota de UI dedicada não encontrada — API `representations/resolve/route.ts` existe, então **write existe via API, sem UI própria fora do 360**).

### USUÁRIO INTERNO
`auth → app_user → role → scope → permission → unidade → operação`
Completo e testado: `permission-matrix.test.ts`, `token-conformance.test.ts` (166 testes — o maior arquivo de teste do repo), `isolation.test.ts`. Esta é a jornada com maior densidade de teste automatizado por linha de código provável.

---

## 8. Empty/Placeholder Routes

Nenhuma rota lida contém "Em breve", "não implementado", "TODO", "FIXME" ou handler no-op. O grep amplo (`Em breve|não implementado|TODO|FIXME|not implemented|no-op|stub` case-insensitive) retornou apenas:
- Ocorrências de "Todos" (palavra portuguesa "all", falso positivo do grep, não placeholder).
- Ocorrências de `stub` como **provider de pagamento dev explícito e documentado** (`webhooks/payments/[provider]/route.ts`, `tenant-gateway-form.tsx`), não placeholder de tela.

Não há PLACEHOLDER real. Os 12 itens de menu `built: false` (seção 4) não são rotas — são entradas de nav inertes sem `href`, por design (ADR-017), não classificáveis como "rota vazia" porque nunca renderizam página nenhuma.

---

## 9. CRUD Completeness

Legenda: ✅ confirmado por leitura · ⚠ provável mas não confirmado linha a linha · — não encontrado · 🚫 não aplicável

| Entidade | CREATE | READ | UPDATE | ARCHIVE/DELETE | 360/DETAIL | SEARCH | FILTER | HISTORY |
|---|---|---|---|---|---|---|---|---|
| Worker | ✅ (`create-worker-form.tsx`) | ✅ | ⚠ (`change-membership-form.tsx` cobre membership, não worker em si) | — | ✅ (`trabalhador-360-*`) | ✅ (`api/search/route.ts` existe) | ⚠ | ✅ (timeline, parcial DEMO) |
| Person | ⚠ (implícito em worker) | ✅ | — | — | 🚫 | ⚠ | — | — |
| Membership | ✅ | ✅ | ✅ (`change-membership-form.tsx`) | ⚠ | ⚠ | — | — | ⚠ |
| Company | ✅ (`create-company-form.tsx`, +`nova-com-master`) | ✅ | ⚠ | — | ✅ (`empresa-360-*`) | ⚠ | ✅ (`companies-table.tsx` tem filtro por status/município) | ✅ (parcial DEMO) |
| Establishment | ⚠ (via API `establishments/route.ts`) | ✅ | ⚠ | — | ✅ (dentro de Empresa 360) | — | — | — |
| Representation | ⚠ (API `resolve`) | ✅ | ⚠ | — | 🚫 (sem 360 próprio) | — | — | — |
| Agreement | ⚠ | ✅ (`/convencoes`) | ⚠ | — | ✅ (`/convencoes/[id]`) | — | ⚠ | — |
| ContributionRule | ✅ (`add-contribution-rule-form.tsx`) | ✅ | ⚠ | — | 🚫 | — | — | — |
| Obligation | ✅ (`generate-charge-form.tsx`/API) | ✅ | ⚠ | — | 🚫 | — | ✅ (filtro por status em `charges/route.ts`) | — |
| Charge | ✅ | ✅ | ✅ (`settle-charge-button.tsx`, `[id]/settle`, `[id]/sync`) | ⚠ (cancel existe em `platform/charges/cancel`) | ✅ (`/cobrancas/[id]`) | — | ✅ | ✅ (via audit) |
| User (app_user/staff) | ✅ (`staff-forms.tsx`, `staff_invite`) | ✅ | ⚠ | ⚠ (revoke — `revoked_at` coluna existe em `staff_invite`) | 🚫 | — | — | — |
| Role | 🚫 (catálogo fixo em código, não CRUD de UI) | ✅ (implícito) | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Office | ✅ (`create-office-form.tsx`) | ✅ | ⚠ | — | ⚠ | — | — | — |

---

## 10. Permission Gaps

- Catálogo confirmado: `packages/permissions/src/index.ts` — 28 `PermissionKey`, 9 `RoleName`, `ROLE_PERMISSIONS` mapeado explicitamente por role (lido integralmente, ~200 linhas).
- Todas as páginas do shell lidas usam `hasAnyGrant`/`can` antes de renderizar dado — nenhuma página lida faz query sem checar permissão primeiro.
- **Gate de nav vs gate de página:** `nav-config.ts` usa `permission`/`permissions` (OR) por item; a função `isBuiltNavItemVisible` chama `can(...)`. Isso é coerente com o padrão "nav é só UI, autorização real é app-layer + RLS" (CLAUDE.md #2).
- **Permission existente mas sem UI dedicada:** `representation.decide` está no catálogo e tem API (`representations/resolve`), mas não há tela de UI própria que exponha esse fluxo fora do 360 de empresa — não é um bug de permissão, é ausência de superfície de UI (consistente com achado da seção 6/7).
- **Não verificado:** se cada API route sem hit de grep para audit/zod (`agreements`, `companies*`, `contribution-rules`, `establishments`, `memberships`, `representations*`, `search`, `webhooks/payments`, `workers`) checa permissão internamente — plausível que sim (padrão é forte no restante do código), mas não confirmado arquivo por arquivo nesta passada.
- Nenhuma inconsistência de permission (botão gateado, ação não gateada) foi encontrada nos arquivos lidos — mas a cobertura de leitura não foi 100% dos 24 route handlers.

---

## 11. Audit/Event Gaps

- Infra de audit/outbox é real e testada: `audit_log` append-only (triggers `audit_log_no_update`/`_no_delete`, confirmado em `0006` e reforçado em `0010`), `outbox_event` com trigger genérico `emit_outbox_event()` (`0007_outbox_triggers.sql`) aplicado a `company`, `person`, `worker`, `membership`, `obligation`, `charge` (confirmado por grep de `for each row execute function emit_outbox_event`).
- `recordAudit` (de `@syntex/database`) confirmado sendo chamado explicitamente em `charges/route.ts` GET, com classificação de dado incluída no metadata (`count`, `status`) — alinhado com CLAUDE.md #5 ("audit log registra a classificação do dado acessado"), embora a classificação explícita por coluna não tenha sido verificada linha a linha em `recordAudit`.
- **Gap identificado:** 9 dos 24 route handlers não tiveram hit de grep para `audit_log`/`outbox_event`/`zod` no corpo do arquivo — não confirma ausência (podem usar helper), mas não pude confirmar presença. Marcar como **verificar**: `agreements`, `companies` (+variantes), `contribution-rules`, `establishments`, `memberships`, `representations` (+`resolve`), `search`, `webhooks/payments`, `workers`.
- Idempotência de consumidor de webhook: `webhooks/payments/[provider]/route.ts` grava em `payment_webhook_event` (tabela existe, migration `0013`) — se há `UNIQUE` de idempotência na tabela não foi confirmado linha a linha nesta passada.

---

## 12. Test Coverage

Execução real (`npx vitest run` dentro de `apps/web`, nesta auditoria): **292 testes, 291 passando, 1 falhando** (detalhado seção 6).

27 arquivos de teste Vitest, mapeados por área:

| Área | Arquivo(s) de teste |
|---|---|
| Formatação BR | `formatters.test.ts` |
| Temporalidade (CLAUDE.md #3) | `temporal.test.ts` |
| Isolamento de tenant | `isolation.test.ts` |
| Estrutura de schema (CLAUDE.md #1) | `structural.test.ts` (1 falha real) |
| Audit/outbox | `audit-outbox.test.ts` |
| Permissões | `permission-matrix.test.ts`, `token-conformance.test.ts` (166 casos) |
| Representação/Convenção | `domain-representation.test.ts`, `domain-agreement.test.ts` |
| Pessoa/worker/filiação | `person-worker-membership.test.ts`, `trabalhador-360.test.ts` |
| Empresa 360 | `empresa-360.test.ts` |
| Financeiro/cobrança | `finance-arrecadacao.test.ts`, `resolve-dues.test.ts`, `payment-gateway.test.ts`, `dashboard-charge-intel.test.ts`, `itau-staff-lote6.test.ts` |
| Control plane / plataforma | `control-plane.test.ts`, `control-plane-ops.test.ts`, `platform-masters.test.ts` |
| Portais | `company-portal.test.ts`, `associate-portal.test.ts` |
| Delegação de escritório | `office-delegation.test.ts` |
| Busca global | `global-search.test.ts` |
| Painel/dashboard | `dashboard-painel.test.ts` |
| Seed/geradores | `seed-generators.test.ts` |
| Progresso/meta | `syntex-progress.test.ts` |

**E2E (Playwright):** `apps/web/e2e/union-domain.spec.ts` — único spec formal encontrado, **não executado** nesta auditoria (fora do escopo read-only rápido; rodar Playwright normalmente sobe servidor, o que se aproxima de "rodar a app" e não foi feito para manter a auditoria estritamente read-only e rápida).

**Gaps de teste:** nenhum teste dedicado encontrado para `staff` (fora do `permission-matrix`), nem para Escritórios como UI de listagem (`escritorios/page.tsx`) além de `office-delegation.test.ts` (que provavelmente cobre a lógica de domínio, não a página).

---

## 13. Module Scorecard

Rubrica: 0 inexistente · 1 conceito · 2 UI/schema parcial · 3 fluxo parcial · 4 operacional DEV · 5 production-ready.

| Módulo | UI | Domain | Data | Read | Write | Permission | Audit | Event | Test | Score Operacional | Score Prod-Ready |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Painel | ✅ | ✅ | real+DEMO | ✅ | 🚫 | ✅ | 🚫 | 🚫 | ✅ | 4 | 2 (mock ainda embutido) |
| Trabalhadores | ✅ | ✅ | real | ✅ | ✅ | ✅ | ⚠ | ✅ | ✅ | 4 | 3 |
| Empresas | ✅ | ✅ | real+DEMO (360) | ✅ | ✅ | ✅ | ⚠ | ✅ | ✅ | 4 | 3 |
| Representação | ⚠ (sem tela própria) | ✅ | real | ✅ (via 360) | ✅ (API) | ✅ | ⚠ | ⚠ | ✅ | 3 | 2 |
| Convenções | ✅ | ✅ | real | ✅ | ⚠ | ✅ | ⚠ | ⚠ | ✅ | 4 | 3 |
| Atendimento (Filiação) | ✅ | ✅ | real | ✅ | ✅ | ✅ | ⚠ | ✅ | ⚠ | 3 | 2 |
| Agenda | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 0 | 0 |
| Homologações | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 0 | 0 |
| Fiscalização | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 0 | 0 |
| Jurídico | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 0 | 0 |
| Arrecadação (agregado R$) | ⚠ (parcial no Painel) | ✅ (schema existe) | DEMO explícito | ⚠ | 🚫 | ✅ | 🚫 | 🚫 | ⚠ | 2 | 1 |
| Cobranças | ✅ | ✅ | real | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 5 | 4 |
| Financeiro (visão consolidada) | 🚫 | ✅ (journal_entry/line existem) | real (sem UI) | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 1 | 0 |
| Comunicação | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 0 | 0 |
| Campanhas | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 0 | 0 |
| Benefícios | ⚠ (DEMO em 360) | 🚫 | DEMO | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 1 | 0 |
| Analytics | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 0 | 0 |
| Syntex Intelligence | ⚠ (DEMO em 360, "intelligence" components) | 🚫 | DEMO | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 1 | 0 |
| Equipe | ✅ | ✅ | real | ✅ | ✅ | ✅ | ⚠ | ⚠ | ⚠ | 4 | 3 |
| Configurações | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 0 | 0 |
| Escritórios/contabilidade | ✅ | ✅ | real | ✅ | ✅ | ✅ | ⚠ | ⚠ | ✅ | 4 | 3 |
| Portais externos (associado/empresa/escritório) | ✅ | ✅ | real | ✅ | ✅ | ✅ | ⚠ | ⚠ | ✅ | 4 | 3 |
| Control Plane (platform) | ✅ | ✅ | real | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 4 | 3 (falha estrutural em `platform_notification`) |

---

## 14. Dependency Graph

Dependências reais observadas em código/schema (não arquitetura inventada):

- **Fiscalização** e **Jurídico** dependem de **Representação** ter tela própria e de **CCT/ACT** ter vigência operável — hoje ambos bloqueados por ausência total de schema, não por Representação (que já tem tabela).
- **Financeiro (visão consolidada)** depende de `journal_entry`/`journal_line` (já existem, migration `0012`) ganharem uma tela — bloqueio é 100% frontend, zero bloqueio de schema.
- **Arrecadação (módulo de menu)** depende da mesma coisa que o comentário em `dashboard/data.ts` já documenta: falta uma agregação segura (RPC ou view) para série R$ real; hoje é resolvido com DEMO explícito. Bloqueio é backend (RPC/agregação), não frontend.
- **Benefícios** e **Syntex Intelligence** não têm nenhuma tabela — bloqueio é de modelagem de domínio (decisão de negócio ainda não tomada), não técnico.
- **Comunicação/Campanhas** dependem de canal de envio — CLAUDE.md já lista Resend como stack aprovada, mas nenhuma tabela ou integração de envio foi encontrada nas migrations.
- **`platform_notification`** (falha estrutural, seção 6) não bloqueia nenhuma outra tabela via FK composta (não encontrada FK filha apontando para ela) — o risco é conceitual/de invariante, não uma cadeia de dependência quebrada agora.

---

## 15. Priority Waves

- **WAVE 0 (bloqueante/estrutural/segurança):**
  1. Corrigir `platform_notification` para ter `UNIQUE (id, tenant_id)` ou justificar formalmente por que essa tabela é exceção ao invariante #1 (ADR próprio, já que hoje o teste falha e o ADR-017 está desatualizado sobre a causa).
  2. Resolver a contradição documental ADR-017 vs ADR-018 (seção 17) — decisão de negócio, não técnica, mas bloqueia clareza de processo para o próximo agente que tocar shell/dashboard.
- **WAVE 1 (fechar o que já tem backend):**
  3. Tela dedicada de Representação (reivindicar/decidir/disputar) — schema e API já existem.
  4. Tela de Financeiro consolidado sobre `journal_entry`/`journal_line` — schema já existe.
- **WAVE 2 (completar módulos parciais):**
  5. Substituir DEMO de Painel (arrecadação R$, deltas) por RPC/view real.
  6. Substituir DEMO de 360 (agenda, benefícios, timeline, intelligence) por dado real conforme cada tabela for criada.
- **WAVE 3 (novos domínios de operação sindical):**
  7. Agenda, Homologações — dependem de decisão de modelagem (não hardcode, CLAUDE.md).
  8. Fiscalização, Jurídico — Jurídico em particular exige tabela separada por LGPD (CLAUDE.md #5), planejar desde o schema.
- **WAVE 4 (engajamento):**
  9. Comunicação/Campanhas — depende de decisão de canal (Resend já aprovado) e de modelagem de campanha.
  10. Benefícios — depende de decisão de negócio sobre o que é "benefício" no domínio SECABC (regra número um do CLAUDE.md aplica-se diretamente aqui).
- **WAVE 5 (IA/analytics):** Analytics, Syntex Intelligence — CLAUDE.md já lista "camada de IA" e "model registry" como "o que NÃO construir agora"; esta wave é explicitamente a última por decisão de projeto já registrada, não só por dependência técnica.

---

## 16. Recommended Next 10 Vertical Slices

1. **Fix UNIQUE(id, tenant_id) em platform_notification** / Problema: invariante #1 violado, testado e falhando agora / Fluxo: nenhum (correção estrutural) / Domínio: Platform / Tabelas: `platform_notification` / Permission: n/a / UI: nenhuma / Testes: `structural.test.ts` já existe, só precisa passar / Dependências: nenhuma / Por que agora: é a única falha vermelha no suite hoje.

2. **Tela de Representação (decisão/disputa)** / Problema: `representation.decide` existe como permission e API mas sem UI própria / Fluxo: REPRESENTAÇÃO / Domínio: `union_representation` / Tabelas: `union_representation` / Permission: `representation.write`, `representation.decide` / UI: nova rota `/representacao` ou `/empresas/[id]/representacao` / Testes: estender `domain-representation.test.ts` / Dependências: nenhuma, schema pronto / Por que agora: maior "backend sem frontend" já identificado.

3. **View/RPC de arrecadação real (R$ previsto x realizado)** / Problema: Painel usa DEMO explícito para este número / Fluxo: COBRANÇA (agregado) / Domínio: `obligation`+`charge` / Tabelas: nenhuma nova, uma view/RPC / Permission: `finance.read` / UI: substituir `DEMO_ARRECADACAO_HERO`/`DEMO_ARRECADACAO_SERIE` / Testes: novo teste de agregação / Dependências: nenhuma / Por que agora: é o mock mais visível do Command Center, mencionado no próprio código como pendência.

4. **Tela de Financeiro consolidado** / Problema: `journal_entry`/`journal_line` sem UI / Fluxo: EMPRESA (conciliação) / Domínio: Finance / Tabelas: `journal_entry`, `journal_line` / Permission: `finance.read` / UI: nova rota `/financeiro` / Testes: novo / Dependências: nenhuma, schema pronto / Por que agora: segundo maior "backend sem frontend".

5. **Substituir DEMO de Trabalhador 360 (agenda/benefícios/timeline) por dado real conforme tabela nasce** / Problema: 5 componentes marcados DEMO / Fluxo: TRABALHADOR / Domínio: depende de qual tabela nova (agenda? benefício?) / Tabelas: a definir por ADR / Permission: a definir / UI: já existe, só troca fonte / Testes: `trabalhador-360.test.ts` já cobre estrutura / Dependências: decisão de modelagem primeiro / Por que agora: menor esforço de UI (componente já existe), mas precisa de ADR antes.

6. **Idempotência confirmada em payment_webhook_event** / Problema: não confirmado se há UNIQUE de dedupe / Fluxo: COBRANÇA / Domínio: Payment gateway / Tabelas: `payment_webhook_event` / Permission: n/a (service-role) / UI: nenhuma / Testes: estender `payment-gateway.test.ts` / Dependências: nenhuma / Por que agora: risco de efeito duplicado em webhook, invariante #4 do CLAUDE.md.

7. **Auditoria dos 9 API routes sem hit de audit/zod confirmado** / Problema: `agreements`, `companies*`, `contribution-rules`, `establishments`, `memberships`, `representations*`, `search`, `webhooks/payments`, `workers` não tiveram audit/zod confirmado por leitura / Fluxo: transversal / Domínio: todos / Tabelas: n/a / Permission: n/a / UI: nenhuma / Testes: novo teste de cobertura de audit por endpoint / Dependências: nenhuma / Por que agora: fecha uma lacuna de verificação, não necessariamente de código (pode já estar certo).

8. **ADR de resolução do conflito ADR-017 x ADR-018** / Problema: shell/dashboard "congelados" (017) vs "podem ser redesenhados sem unfreeze" (018) / Fluxo: processo, não produto / Domínio: n/a / Tabelas: n/a / Permission: n/a / UI: n/a / Testes: n/a / Dependências: nenhuma / Por que agora: qualquer próximo agente que toque o shell precisa saber qual regra vale.

9. **Tela de Configurações (mínima)** / Problema: item de menu `built: false`, mas provavelmente o de menor esforço de modelagem (preferências de tenant, não regra sindical) / Fluxo: USUÁRIO INTERNO / Domínio: `tenant`/`app_user` já existem / Tabelas: nenhuma nova provável / Permission: a definir / UI: nova rota `/configuracoes` / Testes: novo / Dependências: nenhuma / Por que agora: menor vertical slice para tirar um item do `built: false`, valida o padrão de "ligar" nav sem redesign.

10. **Teste e2e Playwright real do fluxo de login → painel → cobrança** / Problema: único spec e2e existente (`union-domain.spec.ts`) não cobre esse caminho, e não foi executado nesta auditoria / Fluxo: USUÁRIO INTERNO + COBRANÇA / Domínio: transversal / Tabelas: n/a / Permission: n/a / UI: n/a (usa UI existente) / Testes: novo spec Playwright / Dependências: nenhuma / Por que agora: valida de ponta a ponta o módulo mais maduro do sistema (Cobranças, score 5/4).

---

## 17. Decisions Needed

| Documento | Regra | Estado Atual | Decisão Necessária |
|---|---|---|---|
| ADR-017 vs ADR-018 | ADR-017: "O App Shell v2... está **congelado**... Se for necessário tocar no shell ou em tokens globais, o agente **para, justifica e espera aprovação**." e "`/painel`... é a **referência congelada**... Alterações futuras... devem ser deliberadas, não incidentais." | ADR-018 (mais recente, 2026-08-23): "Shell e dashboard podem ser redesenhados **sem unfreeze**." Ambos ADRs estão "aceitos" simultaneamente. | Determinar se ADR-018 revoga/emenda formalmente ADR-017 (como ADR-017 mesmo emendou ADR-013) ou se ambos coexistem com precedência não declarada. Nenhum ADR cita o outro como substituição explícita. |
| ADR-017 (pendências, item 3) | "P0 segurança... falha pré-existente: tabela `platform_notification` sem RLS (teste `structural.test.ts`)." | A migration (`0023_platform_ops.sql:117`) mostra RLS **habilitada**. O teste que falha hoje é sobre **UNIQUE (id, tenant_id)** ausente, não RLS. | Atualizar a redação de ADR-017 para refletir a causa real do teste falhando, e decidir se `platform_notification` deve ganhar UNIQUE composta ou ser formalmente excepcionada do invariante #1 (ela não tem `tenant_id NOT NULL`, é notificação de control plane, não dado de tenant estrito). |
| CLAUDE.md ("O que NÃO construir agora") | "Portais externos, control plane, camada de IA, model registry" listado como o que **não** construir agora. | Control plane (`/platform/*`, 4 rotas, `platform_admin` table) e portais externos (`/empresa`, `/escritorio`, `/associado`, 4 route groups completos com sessão própria) **já existem e estão operacionais** (score 4/5 nesta auditoria). | Esclarecer se essa linha do CLAUDE.md está desatualizada (a decisão de construir controlplane/portais já foi tomada e registrada em ADR-014/015/018/019/020, cujos números de migration — `0014` a `0021` — mostram que vieram depois da fundação original) ou se descreve um escopo mais estrito (ex.: "novo" control plane genérico vs o que já existe). |
| ADR-018 | "Ativar Modo A... permitindo mocks de UI no Painel e telas 360." | Confirmado: mocks existem exatamente onde ADR-018 autoriza (Painel, Trabalhador 360, Empresa 360) e em nenhum outro lugar. | Nenhuma — este ponto está consistente, incluído aqui só para registrar que a verificação encontrou conformidade, não conflito. |
| CLAUDE.md (Regra número um) | "Não existe `if (tenant === 'secabc')` neste código. Em nenhuma hipótese." | Grep por `secabc`/`SECABC` no código de aplicação (`apps/web/app`, `features`, `lib`, `packages`) encontrou apenas 3 ocorrências, todas em **conteúdo textual de dado DEMO** (label "SECABC reconhecido", meta "Sede SECABC" em evento de agenda demo) — nenhuma em lógica condicional (`if`). | Nenhuma — regra está sendo seguida; registrado para constar que a verificação foi feita e não achou violação de código, só texto de exibição em dado mock. |

---

*Fim do relatório. Método: leitura direta de arquivo com citação de path:linha onde aplicável; execução real do suite Vitest; nenhuma escrita de código, migration, commit, ou alteração de frontend foi feita durante esta auditoria.*
