# Syntex Operational Baseline

Este documento é uma **fotografia operacional canônica e evolutiva**.  
Descreve capability status e prioridades atuais (**implementation truth** consolidada).  
Decisões arquiteturais normativas continuam registradas em **ADRs** e no `CLAUDE.md`
(**normative truth**). Código/schema/testes são a evidência do que existe;
divergência código↔ADR é GAP a resolver, não “código sempre vence”.

**Auditoria histórica:** `docs/audits/OPERABILITY-MAP-CURSOR-2026-08-23.md`  
**Frontend freeze:** `docs/FRONTEND-APPROVED-BASELINE.md` · commits `d31dcc1` / `3409cdc`  
**Branch operacional:** `operational-core-v1`  
**Atualizado:** 2026-08-30 (ADR-021 — representação Ativa/Pendente/Inativa)

---

## 1. Current Phase

**Operational Core v1** — espinha DoD em `docs/SYNTEX-VERSIONS.md` §2; fatias C1–C5 no fluxo.

- Frontend premium **aprovado e congelado** (ADR-020).
- Slice 0.1: `platform_notification` control-plane-scoped (ADR-019).
- Prioridade: **aceitação humana + C6** (não abrir V2 / Atendimento incidentalmente).
- Redesign global / Modo A: **encerrado**.

### Taxonomia de capability

| Estado | Significado |
|--------|-------------|
| **REAL** | Fonte domínio/Supabase. Seed DEV = dado sintético **persistido** no modelo real (**seed ≠ mock**). |
| **DEV_DEMO** | Hardcoded/showcase para composição visual. Nunca tratar como operacional. Rotulado (C4). |
| **NOT_IMPLEMENTED** | Prometida/desenhada sem fluxo funcional real (pode ter rota/auth). |
| **PLANNED** | No mapa do produto (`built:false` ou futuro), ainda sem módulo. |

### Core V1 — leitura rápida (C5)

| Área DoD | Estado no baseline |
|----------|-------------------|
| Fundação / tenant / IAM | REAL |
| Empresas + estabelecimentos (município) | REAL parcial (sem PATCH rico) |
| Representação claim + recognize | REAL; **UI ADR-021**: Pendente / Ativa / Inativa (persistência ainda reivindicada/reconhecida) |
| Convenções + aplicabilidade | REAL (create CCT UI fraca) |
| Dues → cobrança + origem | REAL |
| Portais / CP | REAL no estado atual — não expandir |
| Painel / 360 | REAL + DEV_DEMO **rotulado** (C4) |
| Atendimento / Arrecadação BI / IA | PLANNED (`built:false`) — **fora V1** |

---

## 2. Product Core

Cadeia canônica:

```
Pessoa / Trabalhador
Empresa / Estabelecimento
Sindicato (tenant)
        ↓
Representação
        ↓
Categoria / Território
        ↓
CCT / ACT / Regra (contribution_rule)
        ↓
Obrigação (snapshot)
        ↓
Cobrança
        ↓
Pagamento / conciliação / baixa
```

---

## 3–8. Blocos e capabilities

### BLOCK 0 — Foundation / Governance

| Capability | Estado | Notas |
|------------|--------|-------|
| Auth | REAL | Supabase Auth + session |
| IAM (roles/grants/scopes) | REAL | app-layer; sem UI admin rica de roles |
| Tenant | REAL | provision via platform |
| RLS | REAL | isolamento tenant |
| Permissions | REAL | `can` / `hasAnyGrant` / `checkPermission` |
| Audit | REAL | `recordAudit`; sem UI viewer |
| Outbox | REAL | triggers + inserts; **consumer produção** parcial |
| Frontend baseline | REAL (congelado) | ADR-020 |
| `platform_notification` | REAL (CP) | ADR-019; não é tabela de tenant |

**Maturidade:** alta no núcleo; production hardening contínuo no Block 8.

### BLOCK 1 — People & Organizations

| Capability | Create | Read | Update | Detail | History | Estado |
|------------|--------|------|--------|--------|---------|--------|
| Companies | ✅ (+município matriz) | ✅ | — UI | ⚠ 360+DEMO | DEMO | REAL (CRUD incompleto; B1 município no create) |
| Establishments | ✅ API+UI Empresa 360 | ✅ lista 360 | — | ⚠ | — | REAL parcial (create+list; sem PATCH) |
| Workers | ✅ | ✅ | — UI | ⚠ 360+DEMO | DEMO | REAL (CRUD incompleto) |
| Persons | ✅ via worker | ✅ | — | via worker | — | REAL |
| Memberships | ✅ | ✅ | ⚠ status | via worker/portal | ⚠ | REAL |
| Staff | ✅ invite/dept | ✅ | — | — | — | REAL |
| Offices | ✅ | ✅ | link/invite | ✅ | — | REAL |

### BLOCK 2 — Union Relations

| Capability | Estado | Notas |
|------------|--------|-------|
| Representation | **READ LIST + WORKSPACE + CLAIM WRITE + DECIDE/RECONHECER REAL** | Claim=`reivindicada`; decide promove `reconhecida` e encerra concorrentes; CCT/dues só `reconhecida` |
| Territory / Registration | REAL (seed/joins) | Sem CRUD UI |
| Categories (econ/prof) | REAL (seed) | Sem CRUD UI |
| Collective Agreements | REAL read + parcial write | Lista/detalhe; resolve aplicabilidade estab+data (B2); create UI fraca |
| Contribution Rules | REAL | Form no detalhe CCT |

### BLOCK 3 — Revenue & Finance

| Capability | Estado | Notas |
|------------|--------|-------|
| Obligation | REAL | Via generate; sem listagem própria |
| Charge | REAL | Lista/nova/detail/settle/intent; detalhe com origem sindical no snapshot (A2) |
| Payment / gateway | REAL (DEV) | Stub/Asaas/Itaú; prod keys à parte |
| Settlement | REAL | Manual + webhook |
| Journal | REAL parcial | Visível no detalhe da charge |
| Revenue aggregation UI | DEV_DEMO / PLANNED | Painel chart DEMO; “Arrecadação” nav `built:false` |
| Financeiro consolidado | PLANNED | Nav `built:false` |

### BLOCK 4 — Union Operations

| Capability | Estado | Notas |
|------------|--------|-------|
| **Atendimento** | **PLANNED** | Nav `built:false` (Slice 0.3). Sem href. Membership real continua em Trabalhadores / 360 — **não** equivale a Atendimento. Rota `/filiacao` permanece como placeholder/deep-link histórico. |
| Agenda | PLANNED | `built:false` |
| Homologações | PLANNED | `built:false` |
| Fiscalização | PLANNED | `built:false` |
| Jurídico | PLANNED | `built:false` |

**/filiacao:** placeholder intacto (não deletado). Não é superfície de nav operacional.

### BLOCK 5 — Engagement & Benefits

| Capability | Estado |
|------------|--------|
| Benefícios | PLANNED (+ cards DEV_DEMO no Trabalhador 360) |
| Comunicação | PLANNED |
| Campanhas | PLANNED |

### BLOCK 6 — Data & Intelligence

| Capability | Estado |
|------------|--------|
| Analytics | PLANNED |
| Syntex Intelligence | PLANNED / DEV_DEMO (cards Painel/360) |

Syntex Intelligence / camada operacional de IA não faz parte do Operational Core
atual e não deve ser expandida incidentalmente.

### BLOCK 7 — External Portals

| Capability | Estado | Notas |
|------------|--------|-------|
| Associate portal | REAL | Conta, filiação, cobranças |
| Company portal | REAL | Cobranças, pay, equipe |
| Office portal | REAL | Multi-empresa + finance scope |

Já arquitetura oficial — expandir só com slice.

### BLOCK 8 — Production Readiness

| Capability | Estado |
|------------|--------|
| E2E amplo | parcial (1 spec product + screenshots) |
| Observability | parcial |
| Outbox consumer / DLQ | parcial / gap |
| Monitoring / runbooks | parcial |
| Production gateways | parcial (DEV ok) |
| LGPD hardening contínuo | parcial (schema ok; ops ANPD incompleto) |
| `built:false` hide em prod | pendência ADR-017 |

---

## 9. Dados DEMO existentes (não remover neste slice)

| Superfície | REAL (banco/seed) | DEV_DEMO |
|------------|-------------------|----------|
| `/painel` | Contagens permission-aware; charge intel aberto | Arrecadação série, alertas, movimento, operation-now, intelligence chips |
| Empresa 360 | Vínculos, filiados, cobranças abertas, representação resolve | Chart, timeline, intelligence, pendências extra, claim split |
| Trabalhador 360 | Person, membership, employment | Timeline, benefícios, agenda, financeiro showcase, intelligence |
| Login brand | — | Stats numéricos **só** `NODE_ENV=development`; SSO placeholder DEV |

---

## 10. Current Build Order

| Wave | Foco | Relação com Core V1 |
|------|------|---------------------|
| **0** | Foundation / governance | Feito |
| **1** | People + Union Relations | Feito (Representação A0–A2, B1–B2) |
| **2** | Revenue fino (lista obrigação, arrecadação BI) | **V1.x** — Cobranças já cobrem V1 |
| **3** | Union Operations (atendimento…) | **V2+** |
| **4–5** | Engagement / Intelligence | **V4–V5** |
| **6** | Production hardening | Ops paralelo / C6 buffer |

Fatias de fechamento Core: **C1–C5** feitas; **C6** = bug bash + aceite formal.

---

## 11. NEXT (após Core V1)

1. **C6 / aceite humano** — runbook + re-seed C3 se ainda não.  
2. **V1.x** conforme gap (PATCH cadastro, lista obrigação, arrecadação BI REAL).  
3. **Não** promover Atendimento / Intelligence / redesign sem DoD de versão.

### Evidência Representação (histórico A0–C4)

- claim + recognize REAL; CCT/dues só `reconhecida`; origem na cobrança; resolve aplicabilidade; seed CCT 2026 + financeiro puro; DEMO rotulado no Painel/360.
- Demo path: Representação → Reconhecer → Cobranças → Resolver débitos → origem.

---

## 12. Nav contract (Core V1 — C5)

Espelho de `apps/web/components/layout/nav-config.ts`. Teste: `tests/core-v1-c5-nav-baseline.test.ts`.

| Item | built | href | Versão / realidade |
|------|-------|------|--------------------|
| Painel | true | `/painel` | V1 — métricas REAL + blocos DEV_DEMO rotulados (C4) |
| Trabalhadores | true | `/trabalhadores` | V1 |
| Empresas | true | `/empresas` | V1 |
| Representação | true | `/representacao` | V1 REAL (claim + recognize) |
| Convenções | true | `/convencoes` | V1 (+ resolve aplicabilidade) |
| Cobranças | true | `/cobrancas` | V1 (dues/resolver/origem) |
| Equipe | true | `/equipe` | V1 / staff |
| Escritórios | true | `/escritorios` | V1 estado atual (ADR-015) |
| Atendimento | **false** | — | **V2** — PLANNED; `/filiacao` placeholder histórico |
| Agenda…Jurídico | **false** | — | V2–V3 |
| Arrecadação | **false** | — | **V1.x** BI — cobranças cobrem fatia V1 |
| Financeiro | **false** | — | PLANNED / futuro |
| Engajamento | **false** | — | V4 |
| Analytics / Intelligence | **false** | — | V5 (+ cards DEMO no Painel) |
| Configurações | **false** | — | PLANNED |

**Regra C5:** não marcar `built:true` por “já existe rota fantasma”. Só capability REAL do contrato V1.

---

## 13. Document map

| Doc | Papel |
|-----|-------|
| `CLAUDE.md` | Lei operacional para agentes |
| `docs/OPERATIONAL-BASELINE.md` | **Este** — mapa canônico de implementation |
| `docs/SYNTEX-VERSIONS.md` | Core V1 / V1.x / V2+ — o que se vende e se entrega por versão |
| `docs/CORE-V1-BUILD-FLOW.md` | Ordem das fatias até aceite do Core V1 |
| `docs/CORE-V1-ACCEPTANCE-RUNBOOK.md` | Roteiro clicável DoD V1 (C1); alinhar copy à ADR-021 |
| `decisoes/ADR-021-…` | Representação operacional: Ativa / Pendente / Inativa |
| `docs/FRONTEND-APPROVED-BASELINE.md` | Freeze visual PO |
| `decisoes/ADR-020-…` | Precedência fase + frontend |
| `decisoes/ADR-019-…` | platform_notification |
| `docs/audits/OPERABILITY-MAP-…` | Auditoria pontual (não canônica) |
| `_arquivo_*` | Histórico |
