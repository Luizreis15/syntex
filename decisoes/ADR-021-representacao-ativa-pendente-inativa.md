# ADR-021 — Representação operacional: Ativa / Pendente / Inativa

- Status: **aceita** (norma de produto / UX / elegibilidade de cobrança)
- Data: 2026-08-30
- Product Owner: decisão explícita em sessão (opção **B**)
- Emenda (narrativa operacional): ADR-003 e DoD em `docs/SYNTEX-VERSIONS.md` §2.3
- Não invalida: ADR-003 quanto a vínculo por **estabelecimento**, vigência e
  unicidade de no máximo uma representação **consolidada** vigente

## Contexto

O Core modelou `union_representation` com linguagem de disputa
(`reivindicada` / `reconhecida` / `disputada` / `perdida`) e um fluxo de
aceite que pedia “reivindicar → reconhecer” no caminho feliz.

Isso **não** corresponde à operação do cliente fundador (SECABC) nem à regra
de produto desejada:

- Descoberta de loja nova = cadastro / rua / contabilidade — **não** teatro
  de “reivindicar para alguém”.
- “Briga” entre sindicatos existe, mas o critério de fundo é **CNAE + base**;
  o processo judicial **não** é workflow do Syntex.
- O sistema deve ser **passivo**: aceita o cadastro que o operador manda;
  se o enquadramento estiver errado, a responsabilidade é de quem pediu o
  cadastro — não de um “juiz” interno do software.

## Decisão

### 1. Nomenclatura de produto (UI e documentos comerciais)

Três estados operacionais:

| Status | Significado | Cobrança / CCT operacional |
|--------|-------------|----------------------------|
| **Pendente** | Cadastro na base, ainda não liberado | **Não** |
| **Ativa** | Liberada na base do sindicato | **Sim** |
| **Inativa** | Encerrada / fora da base | **Não** |

Regra de ouro: **só `ativa` sobe cobrança** (e só `ativa` elege CCT/regras
no caminho operacional).

### 2. Nascimento e ativação (opção B — PO)

1. Ao incluir o estabelecimento na base de representação, o status inicial é
   **pendente**.
2. Um operador autorizado marca **ativa** (um clique / ação clara —
   **não** usar as palavras “reivindicar” / “reconhecer” no caminho feliz).
3. Encerrar → **inativa** (com vigência `valid_until` quando couber).

### 3. O que o sistema **não** faz

- Não arbitra disputa judicial entre sindicatos.
- Não “elege vencedor” de briga externa.
- Não substitui o julgamento de CNAE/território do operador — apenas
  registra a decisão operacional e aplica cobrança quando **ativa**.

### 4. Mapeamento transitório ao schema atual (até migration)

Enquanto o enum/coluna no banco ainda usar os valores históricos:

| Produto (norma) | Persistência atual (ADR-003 / código) |
|-----------------|----------------------------------------|
| Pendente | `reivindicada` |
| Ativa | `reconhecida` |
| Inativa | `perdida` (ou linha encerrada por `valid_until`) |

- Unicidade / `EXCLUDE` “só consolidada” continua valendo sobre o valor que
  mapeia **ativa** (`reconhecida` hoje).
- Status agregado `disputada` e fluxos de rival **não** fazem parte do
  caminho feliz do Core V1; podem permanecer no modelo para histórico /
  segundo sindicato, sem UI obrigatória.

### 5. Trabalho seguinte (implementação — fatia própria)

- UI e copy: Pendente / Ativa / Inativa.
- DoD e runbook: cadastro → **pendente** → marcar **ativa** → CCT → cobrança.
- Opcional V1.x: migration renomeando enum/valores no banco para os nomes
  de produto (sem mudar a semântica desta ADR).

## Consequências

- Caminho feliz do Core **deixa de ser** “reivindicar/reconhecer” como
  narrativa; passa a ser **incluir na base (pendente) → ativar → cobrar**.
- Testes e smoke devem seguir a nova linguagem na UI; domínio pode mapear
  internamente até a migration.
- Documentação comercial (`SYNTEX-VERSIONS`) e baseline devem refletir esta
  norma; código que ainda diga “reconhecida” no gate de dues é **GAP de
  copy/UX**, não invalidação desta ADR — resolver na fatia de implementação.

## Não fazer nesta ADR

- Redesign de shell/painel (ADR-020).
- Workflow jurídico / processo contra rival.
- Radar automático de loja nova (descoberta) — fora; cadastro continua
  informado por operador / contabilidade / fatias futuras.
