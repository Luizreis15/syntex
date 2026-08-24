# Syntex Core V1 — Roteiro de Aceitação

**Status:** Fatia C1 (operacional)  
**Data-base:** 2026-08-24  
**Âncora:** `docs/SYNTEX-VERSIONS.md` §2.3  
**Fluxo:** `docs/CORE-V1-BUILD-FLOW.md`  

Objetivo: um operador (ou PO) consegue **repetir a cadeia mínima** em DEV em **&lt;45 min**, com resultado auditável.  
Não é feature nova — é o script de aceite. Bloqueios encontrados aqui alimentam **C3**.

---

## 0. Como usar este roteiro

1. Pré-requisitos §1 OK.  
2. Executar **caminho feliz** (§2) com login **diretoria**.  
3. Executar **checagens negativas** (§3).  
4. Preencher **resultado** (§5) e **bloqueios** (§6).  
5. Só marcar aceite V1 depois de C2–C6; este doc **não** fecha a V1 sozinho.

Marcar cada passo: `[ ]` → `[x]` ou `BLOQ` + nota em §6.

---

## 1. Pré-requisitos

### 1.1 Ambiente

| Item | Esperado |
|------|----------|
| App web | `apps/web` rodando (ex. `http://localhost:3000`) |
| Supabase | projeto **DEV** (nunca produção) |
| Seed | tenant SECABC populado (`pnpm` / script de seed do web) |
| Migrations | até as de representação/outbox aplicadas (ex. `0028`, `0029`) |

**Atenção:** o seed **apaga e recria** dados DEMO do tenant. Após seed, use só as contas impressas no final do script.

### 1.2 Contas seed (DEV)

Senha comum (impressa no seed): `syntex-dev-2026!`

| Uso no roteiro | E-mail | Roles / escopo |
|----------------|--------|----------------|
| Caminho feliz (writes) | `diretoria@secabc.exemplo.org.br` | `diretoria` + `financeiro`, escopo **tenant** |
| Negativo (sem decide / sem finance.write / sem company.write) | `atendimento.maua@secabc.exemplo.org.br` | `atendimento`, escopo **branch Mauá** |
| Negativo N7 (finance.write sem representation) | `financeiro@secabc.exemplo.org.br` | só `financeiro`, escopo **tenant** (**C3**) |
| Admin (opcional) | `admin@secabc.exemplo.org.br` | `admin`, tenant |

**C3:** usuário financeiro puro existe no seed — use-o para N7/N8 na UI (nav Representação ausente; sem decide).

CCT seed relevantes:

| Mediador | Vigência |
|----------|----------|
| `MR018452/2024` | 2024-05-01 → 2025-04-30 |
| `MR021897/2025` | 2025-05-01 → 2026-04-30 |
| `MR024310/2026` | 2026-05-01 → **2027-04-30** (**C3** — cobre referência ~2026-08) |

**Competência / data de resolução:** preferir competência **atual sob a CCT vigente** (ex. `2026-08`, data `2026-08-15` com referência seed). Competências históricas (`2026-03` sob CCT 2025) continuam válidas para regressão.

Após re-seed, obrigações DEMO abertas usam a CCT que cobre `SYNTEX_SEED_REFERENCE_DATE` (default `2026-08-22`).

### 1.3 Atalhos de dado (seed)

Úteis se não quiser criar empresa do zero:

| Cenário | Exemplo de razão social (seed) | Uso |
|---------|--------------------------------|-----|
| Já `reconhecida` | Mercado Bertoldi / Papelaria Central… | Pular claim/recognize; ir a CCT/dues |
| Só `reivindicada` | Mercearia São Judas Tadeu / Casa do Parafuso… | Exercitar **Reconhecer** |
| Disputa | Auto Peças Rodovale / Drogaria Alvorada… | Ver concorrentes; reconhecer uma → outras `perdida` |

---

## 2. Caminho feliz (DoD §2.3)

Login: **diretoria**. Sidebar deve mostrar Cadastro (Empresas, …), Representação, Convenções, Cobranças (conforme grants).

### Passo 1 — Empresa + estabelecimento (com município)

**Opção A — create (preferida para aceite “cadastrar”)**

| # | Ação | Onde | Esperado |
|---|------|------|----------|
| 1.1 | Abrir lista | `/empresas` | Tabela de empresas |
| 1.2 | Nova empresa | CTA → `/empresas/nova` | Form: identificação, **município da matriz**, endereço, CNAE/unidade |
| 1.3 | Salvar | Submit | Redirect para Empresa 360 (`/empresas/[id]`) |
| 1.4 | Aba Representação | 360 | Lista de estabelecimentos + form create |
| 1.5 | Novo estabelecimento | Form (CNPJ, tipo, **município**, CNAE) | Linha nova + link `/representacao/[establishmentId]` |

**Opção B — seed**

| # | Ação | Esperado |
|---|------|----------|
| 1.B | Abrir empresa seed (ex. Mercearia São Judas) → aba Representação | Matriz (e filiais se houver) com município; link para workspace |

**Critério DoD:** existe empresa **e** estabelecimento com município utilizável na resolução.

---

### Passo 2 — Reivindicar e reconhecer

| # | Ação | Onde | Esperado |
|---|------|------|----------|
| 2.1 | Abrir workspace | `/representacao/[establishmentId]` (ou via lista `/representacao`) | Timeline / cards de status na data de referência |
| 2.2 | (Se ainda sem claim próprio) **Reivindicar representação** | Form no workspace | Nova linha `reivindicada`; **não** muda CCT nem gera cobrança sozinho |
| 2.3 | **Reconhecer** | CTA no card elegível | Status → `reconhecida`; concorrentes sobrepostas → `perdida` |
| 2.4 | Conferir lista | `/representacao` | Status composto coerente (ex. reconhecida; se ainda houver ≥2 ativas disputáveis, agregado pode refletir disputa) |

**Critério DoD:** operador autorizado promoveu representação a `reconhecida`.

---

### Passo 3 — CCT / regras aplicáveis

| # | Ação | Onde | Esperado |
|---|------|------|----------|
| 3.1 | Resolver aplicabilidade | `/convencoes` → painel **Resolver aplicabilidade** | Escolher estab + data **dentro** da vigência (ex. `2026-08-15`) |
| 3.2 | Submeter | Resolve | Status de representação + CCT (ex. `MR024310/2026`) **somente se** `reconhecida` |
| 3.3 | (Opcional) Detalhe | `/convencoes/[id]?date=…` | Regras de contribuição visíveis; link cruzado com 360/workspace |

**Negativo rápido no mesmo estab:** data com status ≠ reconhecida → **sem** eleição automática de CCT.

**Critério DoD:** vê instrumento coletivo aplicável quando reconhecida.

---

### Passo 4 — Resolver débitos e gerar cobrança

| # | Ação | Onde | Esperado |
|---|------|------|----------|
| 4.1 | Abrir resolver | `/cobrancas/resolver` (também link no workspace se reconhecida) | Form empresa + competência |
| 4.2 | Resolver | Empresa do passo 1–2; competência ex. `2026-08` | Lista de débito(s) com regra/CCT; ou mensagem clara se nada devido / base necessária |
| 4.3 | Gerar | CTA de geração (quando amount ok e sem charge existente) | Redirect para `/cobrancas/[id]` |

Se `needsCalculationBase`: informar base no form e resolver de novo.

**Critério DoD:** obrigação + cobrança criadas para a competência.

---

### Passo 5 — “Por que esta cobrança existe”

| # | Ação | Onde | Esperado |
|---|------|------|----------|
| 5.1 | Abrir cobrança | `/cobrancas/[id]` | Valor, competência, status |
| 5.2 | Bloco origem | Seção **Por que esta cobrança existe** | Regra · competência · instrumento (CCT) · status de representação na origem · link ao workspace |
| 5.3 | Evidência | Visual | **Não** deve aparecer texto de `evidence` jurídica no bloco / metadados visíveis de auditoria de status |

**Critério DoD:** operador entende a origem sindical-financeira sem abrir SQL.

---

### Passo 6 — Permissões (resumo; detalhe em §3)

Com **atendimento Mauá** (e, se possível, raciocínio financeiro §3.2): writes críticos de representação/empresa/finance e dados jurídicos indevidos **não** passam.

---

## 3. Checagens negativas

### 3.1 Atendimento (seed)

Login: `atendimento.maua@secabc.exemplo.org.br`

| # | Tentativa | Esperado |
|---|-----------|----------|
| N1 | `/empresas/nova` | Sem permissão (`company.write` / provision) |
| N2 | Create estabelecimento no 360 | Sem UI/API de write (`establishment.write`) |
| N3 | Workspace: Reconhecer | CTA ausente ou API 403 (`representation.decide`) |
| N4 | Claim (reivindicar) | Sem write (`representation.write` ausente no role) |
| N5 | `/cobrancas/resolver` gerar | Sem `finance.write` — não gera |
| N6 | Escopo branch | Dados fora de Mauá não devem vazar além do que a sessão permite |

### 3.2 Financeiro sem representation (C3)

Login: `financeiro@secabc.exemplo.org.br`

| Role | `representation.read/write/decide` | `finance.write` |
|------|--------------------------------------|-----------------|
| financeiro | **não** | sim |
| atendimento | read only (sem write/decide) | não |
| diretoria | sim | (via grant financeiro empilhado no seed) |

| # | Checagem | Esperado |
|---|----------|----------|
| N7 | Abrir workspace / Reconhecer | Sem nav Representação ou sem decide; API 403 se forçar |
| N8 | Sidebar | Item Representação **ausente** (`representation.read` false) |
| N7b | `/cobrancas/resolver` | Pode ler/gerar (tem `finance.*`) |

### 3.3 Temporalidade / elegibilidade

| # | Tentativa | Esperado |
|---|-----------|----------|
| N9 | Resolve aplicabilidade com estab só `reivindicada` | Sem CCT eleita |
| N10 | Dues com competência fora da vigência CCT | Sem débito elegível / vazio coerente |
| N11 | Reconhecer com usuário sem decide | 403 |

---

## 4. Critérios de prontidão desta fatia (C1)

C1 está **pronta** quando:

- [x] Este arquivo existe e está linkado no fluxo / baseline  
- [x] Passos §2 alinhados ao DoD §2.3 e às rotas reais do app  
- [x] Negativos §3 listados  
- [x] Seção §6 pronta para receber bloqueios da **primeira execução humana**  

C1 **não** exige que o caminho feliz já passe 100% — exige que falhas virem bloqueios nomeados.

**Smoke automatizado (C2):** `apps/web/tests/core-v1-smoke.test.ts` — rodar com `npm run test:core-v1` em `apps/web`.

**Seed gaps (C3):** CCT `MR024310/2026` + `financeiro@…` — exige **re-seed** DEV para valer na UI.

---

## 5. Folha de resultado (preencher na execução)

| Campo | Valor |
|-------|-------|
| Data / ambiente | |
| Executor | |
| App URL | |
| Seed recente? (sim/não + data) | |
| Tempo total (meta &lt;45 min) | |
| Passos 1–5 | OK / BLOQ (ids) |
| Negativos N1–N11 | OK / BLOQ / N/A |
| Aceite informal do ciclo | Sim / Não |

---

## 6. Bloqueios encontrados → input C3 / C4

Registrar só o que **impede** o roteiro ou a demo honesta.

| ID | Sintoma | Severidade | Estado |
|----|---------|------------|--------|
| B-SEED-FIN | Sem user só `financeiro` para N7 na UI | média | **Resolvido C3** (`financeiro@secabc.exemplo.org.br`) |
| B-CCT-GAP | Pós 2026-04-30 sem CCT vigente para “competência atual” | média | **Resolvido C3** (`MR024310/2026`) |
| B-… | _(preencher na execução humana)_ | | C4 / buffer |

---

## 7. Fora deste roteiro (não bloquear C1)

- Lista dedicada de obrigações, Arrecadação BI, create CCT rico  
- Atendimento / Agenda / Jurídico / IA  
- Redesign Painel (C4 trata honesty; não redesenha)  
- E2E amplo (C2 = smoke mínimo)

---

**Fim — Roteiro de Aceitação Core V1**
