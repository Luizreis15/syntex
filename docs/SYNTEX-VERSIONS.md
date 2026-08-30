# Syntex — Versões de Produto (Core e Evolução)

**Status:** Documento comercial-operacional vivo  
**Data-base:** 2026-08-24  
**Produto:** Syntex — Soluções Sindicais  

Este documento define **o que se vende e se entrega por versão**.  
Não substitui:

| Documento | Função |
|-----------|--------|
| Product North (norte) | Visão e mapa completo do Union OS |
| `docs/OPERATIONAL-BASELINE.md` | O que está REAL / DEMO / PLANNED **hoje** |
| `CLAUDE.md` / ADRs | Invariantes e decisões normativas |

**Regra:** o North é horizonte. O **contrato** referencia **versão + DoD** deste arquivo.

---

## 1. Modelo de evolução

```
Syntex Core (V1)     →  plataforma usável (espinha sindical-financeira)
        ↓
V1.x                 →  endurecimento do Core (updates pequenos)
        ↓
V2 / V3 / V4 / V5    →  módulos novos (vendáveis como versão ou add-on)
```

- **V1** = funcional básico bom.  
- **Versões seguintes** = acréscimo de capacidade (e base para cobrar updates).  
- Módulos futuros entram por **feature entitlement** por tenant — nunca `if (tenant === 'secabc')`.  
- Item de nav só `built: true` quando a capability for **REAL** (ADR-022: sidebar Core sem mapa fantasma).

---

## 2. Syntex Core — V1

### 2.1 Promessa (uma frase)

O sindicato opera na mesma plataforma: **conhecer a base → quem representa o estabelecimento → qual norma coletiva vale → gerar e acompanhar cobrança**, com permissão, vigência e auditoria.

### 2.2 Escopo incluso (DoD contratável)

| Área | Incluído na V1 |
|------|----------------|
| **Fundação** | Auth, tenant, roles/permissions/scopes, RLS, audit de ações relevantes |
| **Empresas** | Lista, create (com município da matriz), Empresa 360 (blocos REAL; DEMO rotulado se permanecer) |
| **Estabelecimentos** | Lista no 360, create (CNPJ, tipo, município, CNAE), link para representação |
| **Trabalhadores** | Lista, create, 360 com vínculo/filiação mínima (write de status de filiação se já existir) |
| **Representação** | Inclusão na base por estabelecimento: **pendente → ativa → inativa** (ADR-021). Só **ativa** habilita CCT/cobrança. Sem teatro de disputa no caminho feliz. |
| **Convenções** | Lista/detalhe CCT/ACT, regras de contribuição (create de regra se já existir), resolver aplicabilidade (estab + data) |
| **Arrecadação operacional** | Resolver débitos (dues), gerar obrigação + cobrança, listar/detalhar cobranças, baixa manual, origem da cobrança legível |
| **Portais** | Associado / Empresa / Escritório **no estado atual** — sem expansão de escopo |
| **Control plane** | Tenants / ops básicas **no estado atual** — sem expansão |

### 2.3 Cadeia mínima demonstrável (aceitação)

Um operador autorizado consegue, em ambiente acordado (DEV/staging):

1. Cadastrar ou abrir **empresa** e **estabelecimento** (com município).  
2. Incluir na base de representação como **pendente** e marcar **ativa** (ADR-021).  
3. Ver **CCT/regras** aplicáveis (quando **ativa**).  
4. **Resolver débitos** e **gerar cobrança** para uma competência.  
5. Abrir a cobrança e entender **por que existe** (regra / CCT / origem sindical).  
6. Perfis sem permissão **não** executam writes críticos nem veem dados indevidos.

### 2.4 Explicitamente fora da V1

Não fazem parte do Core / não devem constar como entregáveis do contrato V1:

| Fora de escopo V1 | Destino |
|-------------------|---------|
| Atendimento (protocolo/fila) | V2 |
| Agenda / Homologações | V2 |
| Fiscalização | V3 |
| Jurídico (casos/processos) | V3 |
| Benefícios / Comunicação / Campanhas | V4 |
| Analytics consolidado / Syntex Intelligence | V5 |
| Redesign de shell, painel ou 360s | Não (freeze ADR-020) |
| Tesouraria / financeiro administrativo completo / journal UI rica | V1.x ou módulo Financeiro futuro |
| Arrecadação “BI” (previsto×realizado gerencial completo) | V1.x |
| Create rico de CCT / editor genérico de status de representação | Fora ou V1.x pontual (status operacional = Ativa/Pendente/Inativa, ADR-021) |
| Production hardening pleno (DLQ, MFA, E2E amplo, gateways prod) | Plano de ops separado |
| Expandir portais além do que já existe | Só com add-on / versão |

Itens fora do Core **não** aparecem na sidebar (ADR-022). Voltam com DoD de versão.

### 2.5 Critérios de qualidade da V1

- Capability **REAL** = domínio + dado persistido + permission + validação + erro tratado + teste relevante.  
- **Seed ≠ mock.** DEMO visual, se existir, rotulado — não confundir com operação.  
- Sem hardcode por sindicato.  
- Temporalidade respeitada (`valid_from` / `valid_until`, snapshot em obrigação).

---

## 3. V1.x — Endurecimento do Core (updates)

Entregas **sobre o Core**, típicas de evolução contínua / retenção — não abrem módulo novo da sidebar.

Exemplos (priorizar conforme gap do baseline):

| Item | Objetivo |
|------|----------|
| PATCH mínimo empresa / trabalhador | Correção cadastral do dia a dia |
| Lista / ficha de obrigação | Explicar dívida antes da cobrança |
| Arrecadação v0 (competência, previsto×realizado a partir de charges) | Visão gerencial fina **REAL** |
| Honesty do Painel (menos DEMO) | Confiança do operador |
| Smoke E2E do ciclo Core | Aceitação regressiva |
| Hardening de gateway / settle | Operação financeira mais segura |

**Comercial:** pode ser incluso em período de implantação, mensalidade de evolução, ou pacote “Core Continuity”.

---

## 4. Versões de módulo (vendáveis)

| Versão | Nome comercial sugerido | Conteúdo-alvo | Pré-requisito |
|--------|-------------------------|---------------|---------------|
| **V2** | Syntex Operação | Atendimento (discovery → state machine), depois Agenda / Homologação | Core V1 estável |
| **V3** | Syntex Compliance | Fiscalização; Jurídico com segregação forte | Core + Operação (ou só Core, se discovery permitir) |
| **V4** | Syntex Engajamento | Benefícios, Comunicação, Campanhas | Base + preferência de consentimento |
| **V5** | Syntex Intelligence | Analytics; Intelligence permission-aware sobre fatos reais | Processos reais suficientes (não IA sobre DEMO) |

Cada versão:

- tem **DoD próprio** e prazo próprio;  
- **não** invalida o Core;  
- ativa-se por **entitlement** do tenant quando o produto comercial exigir.

---

## 5. Linguagem comercial (referência)

> Vocês recebem o **Syntex Core (V1)**: base, representação sindical, norma coletiva aplicável e cobrança na mesma plataforma, com controle de acesso.  
> Atendimento, jurídico, engajamento e inteligência entram como **versões ou módulos seguintes**, com escopo, prazo e investimento próprios.  
> O mapa completo do produto (Product North) descreve a direção; **este documento** descreve o que está incluso em cada versão contratada.

---

## 6. Hierarquia de verdade em caso de dúvida

1. DoD da **versão contratada** (este arquivo + anexo do contrato)  
2. ADRs / `CLAUDE.md` (não negociáveis de engenharia)  
3. `OPERATIONAL-BASELINE.md` (estado de implementação)  
4. Product North (ambição — não amplia escopo sozinho)

Divergência “North lista X, contrato V1 não inclui X” → **X não é entregável V1**.

---

## 7. Manutenção deste documento

Atualizar quando houver:

- mudança do DoD da V1;  
- criação de pacote comercial V1.x / V2+;  
- decisão explícita de entitlement por módulo.

Não atualizar a cada slice técnico — isso permanece no baseline.

---

**Fim — Syntex Versões de Produto**
