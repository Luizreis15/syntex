# ADR-013 — Sequenciamento de construção e ownership

- Status: aceita (emendada 2026-08-21)
- Data: 2026-08-20 · Emenda: 2026-08-21

## Contexto

O Syntex tem fundação real (Union Domain, FK composta, permissions, outbox, ADRs) e um desvio recente de demo (`prompts/02-1-acabamento-demo.md`: sidebar-fantasma, seed “realista”). A ementa do produto (doc 01) descreve o mapa completo — platform admin, portais, financeiro, bancos. A revisão (doc 02) e a triagem (doc 03) pedem fatia vertical e arrecadação cedo.

Há um produto irmão operacional (`~/veramo`) com a escada de atores e agentes bancários (Asaas / Itaú Bolecode) já em produção. O Syntex não copia UI nem stack do Veramo; reutiliza **padrões de IAM/onboarding** e, no Bloco C, a **porta de pagamento** com adaptadores.

Owner de execução deste repositório: o agente Cursor neste projeto (sem segundo desenvolvedor humano no curto prazo).

## Decisão

### Sequência

Construir na ordem **A → C fino → B externo**:

1. **Bloco A — Relação sindical** (empresa, representação, CCT, regra, trabalhador, filiação)
2. **Bloco C — Arrecadação** (obrigação com snapshot → cobrança → ledger → porta `PaymentGateway` → adaptadores Veramo)
3. **Bloco B — Plataforma e atores** (platform admin, masters, portais, escritório/delegação)

Visão multi-ator (super admin → union master → company master / associado) permanece no **mapa**. Não abre sprint de portais antes de existir obrigação/cobrança real no backoffice.

### Emenda 2026-08-21 — Control plane rico

Com A→C→B (Lotes 1–10) fechados, **descongela-se o control plane rico** em fatias verticais (Lote 11+):

1. Shell `/platform` + lista/detalhe de tenant
2. Visão cross-tenant de cobranças (leitura operacional)
3. Config de gateway por tenant (`default_charge_provider` + campos Itaú)
4. Métricas leves e notificações — só depois das fatias acima

Continua **fora**: tesouraria/saques, workflow engine, IA, menu-fantasma, seed cosmético.

### O que não fazer

- Acabamento de demonstração (menu `em breve`, seed cosmético) como prioridade
- “Definir todo o frontend agora”
- Reescrever agentes bancários do zero — portar via interface
- Workflow engine, tesouraria, IA
- Control plane como ERP completo na primeira fatia

### Execução

Roadmap operacional em `fundacao/05-roadmap-execucao.md`, em **lotes de 10 etapas**. Um lote por vez; checkpoint ao fechar o lote antes de abrir o próximo.

## Consequências

- Navegação mostra só o que existe e o usuário pode acessar
- Banking entra no lote do Bloco C como contrato + stub, depois adaptadores
- Qualquer pedido que contradiga esta ordem exige emenda a este ADR, não “só um prompt”
- Control plane cresce por fatia; cada tela precisa de permissão implícita `platform_admin` + audit onde houver dado financeiro
