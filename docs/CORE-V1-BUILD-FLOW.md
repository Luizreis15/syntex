# Syntex Core V1 — Fluxo de Construção

**Status:** Fluxo operacional ativo  
**Data-base:** 2026-08-24  
**Âncora:** `docs/SYNTEX-VERSIONS.md` (DoD V1)  
**Fotografia:** `docs/OPERATIONAL-BASELINE.md`  
**Engenharia:** `CLAUDE.md` + ADRs  

Este arquivo responde: **como construímos daqui até o Core V1 aceitável** (prazo-alvo 90–120 dias).

---

## 1. Hierarquia (não negociar no meio do slice)

1. `SYNTEX-VERSIONS.md` — o que entra / não entra na V1  
2. `CLAUDE.md` + ADRs — invariantes  
3. Este fluxo — ordem das fatias  
4. Baseline — atualizar **depois** de cada fatia fechada  
5. Product North — só horizonte (não amplia escopo)

---

## 2. Onde estamos (já feito)

| Bloco | Estado |
|-------|--------|
| Fundação (auth, IAM, RLS, audit, outbox insert) | REAL |
| Empresas + create com município | REAL |
| Estabelecimentos create/list no 360 | REAL (B1) |
| Representação lista/workspace/claim/recognize | REAL (A0–A1) |
| Ponte recognize → dues → charge + origem | REAL (A2) |
| Convenções + resolve aplicabilidade | REAL (B2) |
| Cobranças lista/detail/settle/resolver | REAL |
| Portais / CP | REAL no estado atual — **não expandir** |

**Cadeia DoD §2.3:** tecnicamente já caminha em DEV. Falta **fechar buracos de uso diário + aceitação + honesty**.

---

## 3. O que falta para “Core V1 bom” (só isto)

Ordenado por impacto na aceitação §2.3:

| # | Fatia | Objetivo | Critério de pronto |
|---|--------|----------|-------------------|
| **C1** | Roteiro de aceitação Core | Script passo a passo SECABC/DEV (empresa→estab→rep→CCT→dues→charge) | PO/operador consegue repetir em &lt;45 min |
| **C2** | Smoke do ciclo | Teste automatizado (Vitest e/ou 1 Playwright) do caminho feliz | CI/local verde no ciclo |
| **C3** | Gaps cadastro mínimo | Só o que quebrar o roteiro (ex.: PATCH se o demo exigir correção) | Roteiro não trava em cadastro |
| **C4** | Honesty Painel/360 | DEMO rotulado ou escondido nas superfícies do roteiro | Nenhum número DEMO passado como REAL na demo |
| **C5** | Baseline + nav honestos | Baseline = V1; nav `built:false` intacta para fora do Core | Docs = verdade |
| **C6** | Buffer / bug bash | Regressão, seed estável, ajustes | Aceitação formal V1 |

**Explicitamente depois (V1.x, não bloqueia V1):**

- Lista dedicada de obrigações  
- Arrecadação BI / nav Arrecadação  
- PATCH rico empresa/trabalhador  
- Create CCT  
- E2E amplo, DLQ, gateways prod  

---

## 4. Fluxo de trabalho por fatia (ritmo)

```
1. Escolher UMA linha da tabela §3 (C1…C6)
2. Brief curto (objetivo + não fazer + arquivos prováveis)
3. Implementar vertical (domínio → API se preciso → UI → teste)
4. tsc + testes da fatia + Vitest full se tocou domínio
5. Atualizar OPERATIONAL-BASELINE
6. Commit pequeno (1 conceito)
7. PARE para review humano (você)
8. Só então próxima fatia
```

**Proibido no meio da fatia:** redesenho, Atendimento, IA, “já que estamos aqui” em módulo fora do Core.

---

## 5. Papéis

| Papel | Responsável |
|-------|-------------|
| Controle técnico / ordem das fatias | Cursor (este agente) |
| Aprovação de escopo e aceite V1 | Você (PO) |
| Claude / outros | Consulta opcional — **não** altera o plano sem sua ordem |

---

## 6. Estado das fatias

| Fatia | Estado |
|-------|--------|
| **C1** | **Entregue** — `docs/CORE-V1-ACCEPTANCE-RUNBOOK.md` |
| **C2** | **Entregue** — `apps/web/tests/core-v1-smoke.test.ts` + `npm run test:core-v1` |
| **C3** | **Entregue** — CCT `MR024310/2026` + user `financeiro@…` + pick CCT na referência. **Requer re-seed DEV** |
| **C4** | **Entregue** — rótulos DEMO no Painel / Empresa 360 |
| **C5** | **Entregue** — baseline = V1; contrato nav + teste `core-v1-c5-nav-baseline` (2026-08-26) |
| **C6** | Próxima — bug bash + aceite formal / testes humanos |

---

## 6.1 Próxima ação

**Meta reunião SECABC: 17/09/2026** — ver `docs/SECABC-DEMO-17SET.md`.

1. Hoje: atalhos UX + roteiro demo; você clica o ciclo.  
2. Diário 2–3 h: só bugs do caminho feliz até freeze 16/09.  
3. Não abrir V2 / Engajamento / Homologações no meio.

---

## 7. Mapa mental do prazo (90–120 dias)

| Janela | Foco |
|--------|------|
| Dias 1–15 | C1 + C2 + correções C3 urgentes |
| Dias 16–45 | C3 restante + C4 honesty + seed estável |
| Dias 46–75 | Polimento Core, regressão, aceite interno |
| Dias 76–120 | Buffer, demo cliente, só V1.x se sobrar e PO pedir |

Se estourar: **cortar C4 profundidade** e V1.x — **não** abrir V2.

---

## 8. Definição de “podemos iniciar”

Estamos prontos para construir quando:

- [x] `SYNTEX-VERSIONS.md` commitado  
- [x] Fluxo deste arquivo acordado  
- [x] Fatia **C1** entregue (runbook)  
- [x] Fatia **C2** entregue (smoke Vitest)  
- [x] Fatia **C3** entregue (seed CCT 2026 + financeiro puro)  
- [x] Fatia **C4** entregue (honesty DEMO Painel/Empresa 360)  
- [x] Fatia **C5** entregue (baseline + nav honesty)  
- [ ] Re-seed DEV + testes humanos do runbook  
- [ ] Fatia **C6** (bug bash / aceite)  

---

**Fim — Fluxo Core V1**
