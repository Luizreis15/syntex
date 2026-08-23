# Syntex Operational Baseline

Este documento é uma **fotografia operacional canônica e evolutiva**.  
Descreve capability status e prioridades atuais (**implementation truth** consolidada).  
Decisões arquiteturais normativas continuam registradas em **ADRs** e no `CLAUDE.md`
(**normative truth**). Código/schema/testes são a evidência do que existe;
divergência código↔ADR é GAP a resolver, não “código sempre vence”.

**Auditoria histórica:** `docs/audits/OPERABILITY-MAP-CURSOR-2026-08-23.md`  
**Frontend freeze:** `docs/FRONTEND-APPROVED-BASELINE.md` · commits `d31dcc1` / `3409cdc`  
**Branch operacional:** `operational-core-v1`  
**Atualizado:** 2026-08-23 (Slice 0.2)

---

## 1. Current Phase

**Operational Core v1.**

- Frontend premium **aprovado e congelado** (ADR-020).
- Slice 0.1: `platform_notification` control-plane-scoped (ADR-019).
- Prioridade: vertical slices de domínio real.
- Redesign global / Modo A: **encerrado**.

### Taxonomia de capability

| Estado | Significado |
|--------|-------------|
| **REAL** | Fonte domínio/Supabase. Seed DEV = dado sintético **persistido** no modelo real (**seed ≠ mock**). |
| **DEV_DEMO** | Hardcoded/showcase para composição visual. Nunca tratar como operacional. |
| **NOT_IMPLEMENTED** | Prometida/desenhada sem fluxo funcional real (pode ter rota/auth). |
| **PLANNED** | No mapa do produto (`built:false` ou futuro), ainda sem módulo. |

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
| Companies | ✅ | ✅ | — UI | ⚠ 360+DEMO | DEMO | REAL (CRUD incompleto) |
| Establishments | ✅ API | ⚠ | — | ⚠ | — | REAL parcial |
| Workers | ✅ | ✅ | — UI | ⚠ 360+DEMO | DEMO | REAL (CRUD incompleto) |
| Persons | ✅ via worker | ✅ | — | via worker | — | REAL |
| Memberships | ✅ | ✅ | ⚠ status | via worker/portal | ⚠ | REAL |
| Staff | ✅ invite/dept | ✅ | — | — | — | REAL |
| Offices | ✅ | ✅ | link/invite | ✅ | — | REAL |

### BLOCK 2 — Union Relations

| Capability | Estado | Notas |
|------------|--------|-------|
| Representation | **DOMAIN REAL / UI PARCIAL** | Schema, resolve, API `/api/nxt*`, Empresa 360; nav `built:false`; sem módulo UI próprio |
| Territory / Registration | REAL (seed/joins) | Sem CRUD UI |
| Categories (econ/prof) | REAL (seed) | Sem CRUD UI |
| Collective Agreements | REAL read + parcial write | Lista/detalhe; create UI fraca |
| Contribution Rules | REAL | Form no detalhe CCT |

### BLOCK 3 — Revenue & Finance

| Capability | Estado | Notas |
|------------|--------|-------|
| Obligation | REAL | Via generate; sem listagem própria |
| Charge | REAL | Jornada mais madura (lista/nova/detail/settle/intent) |
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

| Wave | Foco |
|------|------|
| **0** | Foundation / governance (docs, estrutural, honesty nav) |
| **1** | People + Union Relations (CRUD mínimo + **Representação**) |
| **2** | Revenue / Finance (obligation list, arrecadação real, hardening pay) |
| **3** | Union Operations (atendimento real, depois agenda/homologação…) |
| **4** | Engagement |
| **5** | Data / Intelligence (só com processos reais) |
| **6** | Production hardening contínuo |

---

## 11. NEXT PRODUCT DOMAIN

### REPRESENTAÇÃO SINDICAL

**Por quê agora:**

- schema + EXCLUDE + seed existem;
- permissions `representation.*` existem;
- `resolveRepresentation` + API `/api/nxt` / `resolve` existem;
- Empresa 360 já consome representação;
- falta superfície operacional própria (`built:false` hoje);
- conecta Empresa → CCT → Arrecadação.

---

## 12. Nav notes (sem alteração neste slice)

| Item | built | href | Realidade |
|------|-------|------|-----------|
| Atendimento | false | — | PLANNED (Slice 0.3); `/filiacao` placeholder histórico |
| Representação | false | — | Domain REAL / UI parcial |
| Agenda…Jurídico | false | — | PLANNED |
| Arrecadação / Financeiro | false | — | PLANNED (cobranças cobrem fatia) |
| Engajamento / Inteligência / Config | false | — | PLANNED |

---

## 13. Document map

| Doc | Papel |
|-----|-------|
| `CLAUDE.md` | Lei operacional para agentes |
| `docs/OPERATIONAL-BASELINE.md` | **Este** — mapa canônico |
| `docs/FRONTEND-APPROVED-BASELINE.md` | Freeze visual PO |
| `decisoes/ADR-020-…` | Precedência fase + frontend |
| `decisoes/ADR-019-…` | platform_notification |
| `docs/audits/OPERABILITY-MAP-…` | Auditoria pontual (não canônica) |
| `_arquivo_*` | Histórico |
