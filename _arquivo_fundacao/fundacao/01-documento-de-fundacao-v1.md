# DOCUMENTO DE FUNDAÇÃO — Plataforma SaaS de Gestão Sindical (Veramo Sindicato OS)

> Documento canônico do projeto. Fonte: versão original fornecida pelo Product Owner.
> Status: v1 — base de referência. Alterações estruturais devem gerar ADR (ver seção 55).
> **Pendência aberta:** o produto é referido como "Veramo Sindicato OS" neste documento e como "Syntex" no projeto. Nome a decidir antes de contrato, domínio e repositório.

**Produto:** Plataforma Integrada de Gestão Sindical
**Desenvolvedor / Product Owner:** Veramo — Soluções Digitais
**Cliente fundador / Design Partner:** Sindicato dos Comerciários do ABC — SECABC
**Modelo:** SaaS B2B multi-tenant, multiunidade, modular e escalável
**Arquitetura proposta:** Next.js + Vercel + Supabase/PostgreSQL + Railway Workers/Redis
**Objetivo estratégico:** criar um sistema operacional completo para entidades sindicais, validado inicialmente na operação real do SECABC e posteriormente comercializável para outros sindicatos.

---

## 1. VISÃO DO PRODUTO

O projeto não consiste na criação de um ERP convencional nem de um conjunto isolado de telas administrativas. A proposta é construir um **Sindicato Operating System — Sindicato OS**.

Uma plataforma capaz de centralizar: trabalhadores; associados; empresas; arrecadação; financeiro; atendimento; agendas; benefícios; prestadores; homologações; jurídico; comunicação; documentos; campanhas; unidades; usuários; permissões; inteligência de dados; automações; integrações; inteligência artificial.

O sistema deve transformar dados que hoje vivem dispersos em planilhas, sistemas diferentes, arquivos, e-mails, WhatsApp e conhecimento dos funcionários em uma base operacional única, estruturada, auditável e inteligente.

## 2. TESE DE MERCADO

A oportunidade não é "criar um sistema para o SECABC", e sim **criar uma infraestrutura tecnológica especializada para gestão sindical brasileira**.

O SECABC será: primeiro cliente; cliente fundador; ambiente de discovery; fonte de requisitos; laboratório operacional; ambiente de validação; primeiro case; referência comercial.

Mas nenhuma decisão estrutural importante deverá depender exclusivamente do funcionamento atual do SECABC.

```
VERAMO SINDICATO OS
├── Sindicato dos Comerciários do ABC
├── Sindicato B
├── Sindicato C
├── Sindicato D
└── Sindicato N
```

Cada organização será um `tenant`.

## 3. PROBLEMA CENTRAL

A maioria das entidades possui diversas operações diferentes funcionando sobre o mesmo conjunto de pessoas e empresas. Porém, geralmente essas informações ficam fragmentadas.

```
CADASTRO DO ASSOCIADO → outro sistema
FINANCEIRO            → planilha
AGENDA                → WhatsApp
HOMOLOGAÇÃO           → sistema próprio
JURÍDICO              → outro sistema
ARRECADAÇÃO           → planilhas + banco
COMUNICAÇÃO           → WhatsApp + e-mail
DOCUMENTOS            → pastas
GESTÃO                → relatórios manuais
```

A plataforma deverá transformar isso em:

```
                 SINDICATO OS
                     │
       ┌─────────────┼─────────────┐
 TRABALHADOR      EMPRESA      OPERAÇÃO
       └─────────────┼─────────────┘
                DATA CORE
     ┌───────────────┼────────────────┐
 FINANCEIRO      COMUNICAÇÃO      INTELIGÊNCIA
```

## 4. DORES QUE O PRODUTO RESOLVE

**4.1 Fragmentação de dados** — o mesmo trabalhador aparece no cadastro, financeiro, agenda, jurídico, homologação, colônia, campanhas e listas de WhatsApp. O sistema deverá criar uma *Single Source of Truth*.

**4.2 Duplicidade cadastral** — evitar CPF duplicado, empresas duplicadas, registros diferentes para a mesma pessoa, informações conflitantes, telefones divergentes, cadastros desatualizados.

**4.3 Falta de histórico** — cada entidade relevante deverá possuir timeline.

```
JOÃO DA SILVA
2019  Cadastrado
2020  Tornou-se associado
2021  Atendimento odontológico
2022  Alteração de empresa
2023  Homologação
2024  Atendimento jurídico
2025  Reserva colônia
2026  Atualização cadastral
```

**4.4 Dependência de funcionários específicos** — transformar conhecimento individual em processo institucional.

**4.5 Falta de segregação** — combinar RBAC, ABAC, escopo, unidade, tenant, módulo, ação e sensibilidade do dado.

```
RECEPCIONISTA
Associado:        READ ✓  CREATE ✓  UPDATE ✓
Financeiro geral: READ ✕
Jurídico:         READ ✕
Agenda:           READ ✓  CREATE ✓  UPDATE ✓
```

Não será apenas ocultação visual. A autorização deverá existir também na camada de dados/API (RLS + custom claims no Supabase).

## 5. PARA QUEM É O PRODUTO

**5.1 Gestão sindical** — presidência, diretoria, gerência, coordenadores, supervisores. Necessidades: indicadores, operação, arrecadação, produtividade, inadimplência, crescimento, serviços, associados, empresas, unidades, campanhas.

**5.2 Funcionários do sindicato** — atendimento, cadastro, financeiro, cobrança, jurídico, homologação, comunicação, administração, RH, gestores, prestadores autorizados. Cada função terá um workspace específico.

**5.3 Trabalhador / Associado** — portal próprio futuro: minha conta, minha associação, minhas cobranças, meus pagamentos, meus benefícios, minha agenda, meus atendimentos, meus documentos, minhas reservas, minhas homologações, meus dados.

**5.4 Empresa** — segundo portal externo: cadastro, estabelecimentos, trabalhadores, guias, contribuições, débitos, pagamentos, documentos, homologações, convenções, solicitações, atendimento.

## 6. AS TRÊS CAMADAS DO PRODUTO

1. Backoffice do sindicato
2. Portal do trabalhador
3. Portal da empresa

Todos sobre a mesma plataforma.

## 7. DOMÍNIOS PRINCIPAIS

A arquitetura deverá ser baseada em domínios e não em páginas.

**Domínio 01 — Identity & Access Management:** autenticação, usuários, roles, permissions, unidades, escopos, tenants, sessões, MFA, auditoria de acesso.

**Domínio 02 — Organização:**

```
Sindicato
 ├── sede
 ├── regionais
 ├── departamentos
 ├── equipes
 ├── colaboradores
 └── prestadores
```

SECABC inicialmente: Santo André; Mauá; São Caetano do Sul; São Bernardo do Campo; Diadema. **A modelagem não poderá ter essas unidades hardcoded.**

## 8. CORE DE PESSOAS

Não criar uma tabela isolada chamada simplesmente `associados`. A pessoa deve existir independentemente da relação dela com o sindicato.

```
PERSON
├── trabalhador
├── associado
├── dependente
├── usuário
├── responsável
└── contato empresarial
```

Um mesmo indivíduo poderá assumir vários papéis.

## 9. CORE DE EMPRESAS

```
ORGANIZATION / COMPANY
CNPJ · Razão social · Nome fantasia · CNAE · Endereço · Contato
Estabelecimentos · Status · Categoria · Enquadramento · Histórico
Funcionários · Contribuições · Pendências · Documentos
```

Uma empresa poderá possuir vários estabelecimentos.

## 10. RELAÇÃO TRABALHADOR × EMPRESA

Domínio próprio. Não vincular simplesmente `worker.company_id`, porque o trabalhador muda de empresa ao longo do tempo. Criar conceito de vínculo:

```
EMPLOYMENT_RELATIONSHIP
worker_id · company_id · branch_id
start_date · end_date
position · category
status · source
```

## 11. ASSOCIATIVISMO

```
MEMBERSHIP
person · sindicato · status · data de associação
categoria · forma de contribuição · benefícios · dependentes · histórico
```

Status: `prospect`, `ativo`, `suspenso`, `inadimplente`, `cancelado`, `desfiliado`, `falecido`. As regras deverão ser configuráveis pelo sindicato.

## 12. MÓDULO ATENDIMENTO

Busca global; cadastro; atualização cadastral; associação; dependentes; histórico; recebimentos autorizados; emissão de recibos; solicitações; documentos; benefícios; agenda; comunicação. Interface semelhante a um CRM.

## 13. WORKSPACE 360º DO TRABALHADOR

```
JOÃO SILVA                         ATIVO
CPF · Telefone · E-mail · Empresa atual

[Resumo] [Associação] [Financeiro] [Atendimentos] [Agenda]
[Benefícios] [Dependentes] [Homologações] [Jurídico]
[Documentos] [Comunicações] [Histórico]
```

As abas serão exibidas conforme autorização.

## 14. MÓDULO CADASTRO EMPRESARIAL

Cadastro; atualização; busca CNPJ; validação; enriquecimento; estabelecimentos; enquadramento; classificação; histórico; trabalhadores vinculados; convenções aplicáveis; pendências; contribuições; documentos.

## 15. WORKSPACE 360º DA EMPRESA

```
EMPRESA XYZ LTDA
CNPJ · Status · Categoria · CNAE · Município

[Resumo] [Estabelecimentos] [Trabalhadores] [Contribuições]
[Guias] [Pagamentos] [Débitos] [Homologações]
[Documentos] [Contatos] [Comunicações] [Histórico]
```

## 16. FINANCEIRO

Domínio crítico, com arquitetura própria.

**Cobrança:** títulos; parcelas; vencimentos; regras; juros; multa; desconto; negociação; cancelamento; estorno; baixa manual; baixa automática.

**Recebimento:** PIX; boleto; cartão; dinheiro; transferência; outros meios configuráveis.

**Arrecadação empresarial:** contribuições; guias; competência; regras; cálculo; vencimentos; pagamentos; divergências.

**Inadimplência:** aging; régua; notificações; renegociação; histórico.

**Conciliação:** cobrança → pagamento → gateway/banco → conciliação → baixa → ledger.

## 17. FINANCIAL LEDGER

Operações financeiras não deverão depender apenas de alteração de status. Construir um ledger operacional:

```
charge.created · payment.detected · payment.confirmed
payment.refunded · charge.cancelled · discount.applied
```

Não substitui a contabilidade oficial; o sistema deverá permitir integração com sistemas contábeis.

> **Correção pendente (ver doc 03):** o que está descrito aqui é um *log de eventos de domínio*, não um *ledger*. São conceitos distintos e devem ser separados — eventos de domínio de um lado, journal/subledger de partidas dobradas do outro.

## 18. SPLIT DE PAGAMENTO

```
Pagamento R$ 100
Sindicato  R$ 80
Prestador  R$ 15
Plataforma R$  5
```

Regras não fixadas em código: `split_rule`, `split_recipient`, `split_transaction`.

## 19. AGENDA E SERVIÇOS

O sindicato funciona parcialmente como marketplace interno de benefícios. Criar engine de serviços (dentista, médico, psicólogo, cabeleireiro, manicure, advogado etc.).

Cada serviço poderá possuir: unidade; profissional; duração; agenda; capacidade; preço; gratuidade; elegibilidade; intervalo; recorrência; cancelamento; no-show.

## 20. ENGINE DE AGENDAMENTO

```
SERVICE → PROVIDER → LOCATION → AVAILABILITY → SLOT → BOOKING
```

## 21. COLÔNIA DE FÉRIAS

Domínio de reservas próprio:

```
PROPERTY · UNIT · ACCOMMODATION · CAPACITY · RATE · SEASON
AVAILABILITY · RESERVATION · GUEST · PAYMENT · CHECK-IN · CHECK-OUT
```

Funções futuras: calendário de ocupação; lista de espera; bloqueios; feriados; alta temporada; regras por categoria; número máximo de dependentes.

## 22. HOMOLOGAÇÕES

```
Solicitação → Validação → Documentos → Pendências → Agendamento
→ Análise → Homologação → Assinatura → Conclusão → Arquivo
```

Com SLA; responsáveis; histórico; documentos; notificações; assinatura; agenda; auditoria.

## 23. JURÍDICO

Não um software jurídico completo — um *Legal Service Management*.

```
Atendimento → Triagem → Área jurídica → Responsável
→ Documentos → Status → Providência → Conclusão
```

Áreas: trabalhista; previdenciário; consumidor; sindical; outros. Controle de acesso especialmente restritivo.

## 24. CRM DE ATENDIMENTOS

```
interaction
tipo · canal · origem · usuário · pessoa/empresa
data · assunto · resultado · próxima ação
```

Canais: presencial; telefone; e-mail; WhatsApp; portal; chatbot.

## 25. COMUNICAÇÃO

*Communication Hub*: e-mail; WhatsApp; SMS (futuro); push (futuro); notificação interna. Todos sobre a mesma engine.

## 26. TEMPLATE ENGINE

Evitar textos hardcoded.

```
payment_overdue · appointment_confirmation · membership_created
company_registered · document_missing · reservation_confirmed
```

Variáveis: `{{person.name}}`, `{{company.name}}`, `{{charge.amount}}`, `{{appointment.date}}`.

## 27. CAMPANHAS

*Audience Builder*. Ex.: associadas mulheres, 30–55 anos, ativas, de Santo André, vinculadas ao comércio varejista.

```
AUDIENCE → CAMPAIGN → CHANNEL → MESSAGE → DELIVERY → INTERACTION
```

## 28. DOCUMENT MANAGEMENT

Documentos são entidades, não arquivos soltos.

```
document
tenant · owner · entity · type · category · storage_key
created_by · created_at · visibility · version · checksum
```

Tipos: identidade; comprovante; contrato; guia; recibo; declaração; homologação; jurídico; comprovante financeiro.

## 29. SISTEMA DE TAREFAS

*Task Engine* transversal — uma tarefa poderá nascer de qualquer módulo.

## 30. WORKFLOW ENGINE

```
workflow · workflow_stage · workflow_transition · workflow_rule · workflow_action
```

Ex. homologação: Recebida → Em análise → Pendência → Reanálise → Aprovada → Concluída.

> **Ressalva (docs 02 e 03):** não construir engine genérica cedo. Implementar 3–5 workflows reais como máquinas de estado e só depois extrair a abstração comum.

## 31. SEARCH GLOBAL

Uma única busca retornando trabalhadores, empresas, documentos, cobranças, homologações, atendimentos e reservas — obedecendo às permissões do usuário.

## 32. INTELIGÊNCIA ARTIFICIAL

A IA não deverá ser apenas um chatbot; deverá atuar como copiloto operacional: busca semântica; pesquisa; apoio ao atendimento; gestão; comunicação; dados.

## 33. AI SAFETY LAYER

Se o usuário X não possui `finance.read`, a IA também não possui. A IA deverá trabalhar sobre uma camada autorizada de ferramentas/queries, sem acesso administrativo irrestrito ao banco.

## 34. HUMAN-IN-THE-LOOP

Ações críticas exigem confirmação explícita: cobrança; exclusão; cancelamento; alteração financeira; disparo massivo; alteração cadastral crítica.

## 35. MULTI-TENANCY

Toda entidade relevante deverá possuir `tenant_id`. Nenhuma consulta deverá retornar registros de outro tenant.

> **Insuficiente como especificação (ver doc 03):** falta definir tabelas globais × de tenant, FK composta com `tenant_id`, uniques por tenant, contexto de tenant em jobs, isolamento de arquivos, provisionamento, suspensão e encerramento.

## 36. MULTI-UNIDADE

`tenant └── branches`. Usuário poderá ter acesso a uma unidade, a várias, ou a todas.

## 37. MODELO DE AUTORIZAÇÃO

```
ROLE → PERMISSION → SCOPE

finance.charge.read · finance.charge.create · finance.charge.cancel
worker.read · worker.update · company.read · company.update · legal.read

Escopos: own · branch · department · tenant · global
```

> **Dependência não resolvida:** o escopo `department` pressupõe uma entidade de departamento que o documento não modela (ver doc 03, balde A).

## 38. SECURITY BY DESIGN

Baseline: OWASP ASVS; OWASP API Security; menor privilégio; deny by default; Zero Trust; segregação de ambientes; gestão segura de secrets; MFA; auditoria. LGPD/ANPD como requisito arquitetural.

## 39. AUDIT LOG

Eventos imutáveis ou append-only: quem; quando; tenant; unidade; IP; device/session; ação; entidade; before; after; request_id.

## 40. STACK DE FUNDAÇÃO

**Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query/Table, React Hook Form, Zod.
**Aplicação web:** Vercel (região `gru1`, São Paulo, para reduzir latência).
**Banco/Core Platform:** Supabase, PostgreSQL, Auth, Storage, Realtime, RLS, pgvector.
**Processamento assíncrono:** Railway, NestJS/Node, Redis, BullMQ, Workers, Cron.

> **Em revisão:** Railway não possui região na América do Sul. Ver ADR-007 pendente (doc 03).

## 41. ARQUITETURA

Começar como **Modular Monolith**, não como dezenas de microservices.

```
Application
├── Identity ├── Members ├── Companies ├── Finance ├── Scheduling
├── Benefits ├── Homologation ├── Legal ├── Communications └── Documents
```

Com fronteiras claras entre domínios, permitindo extração futura.

## 42. EVENT-DRIVEN INTERNAMENTE

```
member.created · membership.activated · company.created
charge.created · payment.confirmed · appointment.booked · homologation.completed
```

Eventos alimentam notificações, automações, analytics, workers e integrações.

> **Falta o mecanismo:** sem Transactional Outbox, um evento pode ser perdido entre o commit no Postgres e o publish no Redis (ver doc 03).

## 43. WORKERS

`worker-finance`, `worker-communication`, `worker-import`, `worker-integration`, `worker-ai`.

## 44. AMBIENTES

Mínimo: local, dev, staging, production. Ideal: local, development, preview, staging, production. Banco, secrets e integrações separados. Jamais dados reais indiscriminadamente em desenvolvimento.

## 45. REPOSITÓRIO

```
monorepo
/apps    → /web  /worker
/packages → /database /ui /auth /permissions /events /types /validation /config
```

## 46. DESIGN SYSTEM

Antes de dezenas de telas, criar o Design System próprio: Button, Input, Select, Combobox, DataTable, Drawer, Modal, Command, Badge, Timeline, Tabs, Metric, Chart, Filter, Search, Activity, EmptyState, Skeleton, Alert.

## 47. EXPERIÊNCIA DE SOFTWARE

Interface limpa; alta densidade quando necessária; hierarquia visual; command palette; busca global; drawers; filtros persistentes; tabelas modernas; views salvas; bulk actions; timelines; dashboards; quick actions; atalhos; feedback em tempo real.

## 48–53. ETAPA ZERO — PRODUCT DISCOVERY

**48/49. Levantamento de processos** — entrevistas por departamento mapeando entrada, processamento, saída, responsável, dados, documentos e exceções.

**50. Shadowing operacional** — observar funcionários executando operações reais: o que fazem, onde, por quê, o que anotam, o que consultam, o que repetem, onde erram, onde esperam.

**51. Inventário de sistemas** — sistemas atuais; bancos; planilhas; APIs; documentos; integrações; fornecedores; e-mails; WhatsApp; arquivos.

**52. Data discovery** — Data Dictionary: campo, descrição, origem, tipo, obrigatório, sensibilidade, responsável, qualidade.

**53. Domain mapping** — Event Storming; Domain Storytelling; User Story Mapping. Resultado: entidades, eventos, atores, regras, exceções, dependências.

## 54. DEFINIÇÃO DO CORE

```
tenant · branch
user · role · permission
person · worker · dependent · membership
company · establishment · employment_relationship
service · provider · appointment
charge · payment · transaction
document · interaction · task · workflow
homologation · legal_case
property · reservation
campaign · communication
```

> **Ausente:** o domínio sindical propriamente dito — representação, território, categoria econômica e profissional, CCT/ACT e regra de contribuição. Ver doc 03, item 2.

## 55. ADR — ARCHITECTURE DECISION RECORDS

```
ADR-001 Usar PostgreSQL/Supabase
ADR-002 Multi-tenancy compartilhado por tenant_id
ADR-003 RBAC + Scope + RLS
ADR-004 Modular Monolith
ADR-005 Railway para workers
ADR-006 Event-driven internal architecture
```

## 56. FASE 1 — FOUNDATION

Repository; CI/CD; Environments; Database migrations; Observability; Authentication; Tenancy; Branches; RBAC; RLS; Audit; Feature Flags; Design System; Error Handling; Logging; Event Bus; Queue; Storage.

> **Contradiz a seção 68** (ver doc 02, item B2): fundação monolítica antes de qualquer valor entregue é o oposto de vertical slice.

## 57. FASE 2 — CORE CADASTRAL

Pessoa; Trabalhador; Associado; Dependentes; Empresa; Estabelecimentos; Vínculo empregatício; Unidades; Timeline; Documentos; Busca.

## 58. FASE 3 — ATENDIMENTO

CRM; perfil 360º; interações; associação; histórico; documentos; solicitações; tarefas.

## 59. FASE 4 — SERVIÇOS E AGENDA

Engine genérica; depois ativar dentista, médico, psicólogo, salão, manicure, outros.

## 60. FASE 5 — FINANCEIRO

Somente após o Core sólido: charge engine; payments; ledger; cobrança; baixa; conciliação; inadimplência; regras; arrecadação. Testes e auditoria mais rigorosos.

> **Sequenciamento em revisão** (doc 02, item B1): arrecadação é a dor nº 1 do cliente. Antecipar a fatia fina cobrar → conciliar → baixar para a Fase 2.

## 61–66. FASES 6 A 11

6 Comunicação (WhatsApp, e-mail, notifications, templates, campaigns) · 7 Homologação · 8 Colônia · 9 Jurídico · 10 Portal do Trabalhador · 11 Portal da Empresa.

## 67. FASE 12 — IA

A IA entra depois que dados + permissões + domínios + eventos estiverem estruturados. Caso contrário, teremos um chatbot sobre dados desorganizados.

## 68. ORDEM DE IMPLEMENTAÇÃO POR VERTICAL SLICE

```
UX → API → Permission → Database → Audit → Event → Tests → Observability
```

## 69–83. TEST STRATEGY

**70 Unit tests** — regras isoladas (juros, associação, disponibilidade, status).
**71 Integration tests** — API↔DB, API↔Queue, API↔Gateway, Worker↔DB.
**72 Database tests** — constraints, indexes, triggers, migrations, RLS, policies.
**73 Permission matrix tests** — obrigatório; falha aqui é mais grave que falha visual.
**74 Contract tests** — bancos, gateways, WhatsApp, e-mail, APIs públicas, parceiros.
**75 End-to-end** — cadastrar → associar → gerar cobrança → receber → baixar → recibo.
**76 Security tests** — OWASP ASVS, API Security, dependency/secret scanning, SAST, DAST, pentest.
**77 Performance tests** — 10/100/500/1.000/5.000 usuários; operações pesadas (ex. 50.000 cobranças) viram processamento assíncrono.
**78 Queue tests** — retry, timeout, failure, duplicate, idempotency, dead letter.
**79 Backup & restore test** — backup sem restore testado não é estratégia.
**80 Disaster recovery** — RPO e RTO por criticidade.
**81 Observability** — Logs, Metrics, Traces, Errors, Audit, Alerts (Sentry, OpenTelemetry, PostHog).
**82 Request ID** — `request_id`, `trace_id`, `job_id` atravessando browser → API → queue → worker → gateway.
**83 Idempotência** — especialmente financeiro; webhook duplicado não pode gerar dois pagamentos.

## 84–86. MIGRAÇÕES E DADOS

**84** Migrations versionadas no Git: migration → PR → review → staging → test → production. Nunca alterar tabela manualmente em produção.
**85 Data migration do SECABC** — projeto separado: Extract, Transform, Clean, Map, Load, Validate.
**86 Data quality** — indicadores: CPF inválido, telefone ausente, e-mail inválido, empresa inexistente, registro duplicado, endereço incompleto.

## 87–93. ENTREGA

**87 CI/CD** — branch → PR → lint → typecheck → unit → integration → security scan → preview → review → merge → staging → production.
**88 Feature flags** — por tenant, unidade, módulo ou percentual de usuários.
**89 Piloto** — Pilot 01 Atendimento Santo André; depois Cadastro; depois Financeiro; depois regionais.
**90 UAT** — funcionários reais validam. Critério: "consegue substituir o processo atual sem criar uma regressão operacional?"
**91 Shadow mode** — sistema antigo e novo em paralelo, comparando resultados (financeiro, arrecadação, cobrança).
**92 Go-live checklist** — backup, migration, permissions, monitoring, workers, integrations, support, rollback, training, documentation.
**93 Hypercare** — monitorar bugs, fricções, dúvidas, gargalos, comportamentos inesperados.

## 94–96. PRODUTO E OPERAÇÃO

**94 Product analytics** — feature usage, tempo por fluxo, erros, abandono, buscas, ações mais usadas.
**95 Documentação** — Product, Technical, API, Operational Runbooks.
**96 Runbooks** — gateway fora do ar; Redis indisponível; webhook atrasado; banco degradado; WhatsApp bloqueado; worker acumulando fila.

## 97–101. GOVERNANÇA, PRIVACIDADE E CONTROLE

**97 Governança de dados** — dono do dado, quem edita, quem exclui, retenção, quem exporta.
**98 Privacy by design** — por módulo: dado necessário, finalidade, acesso, retenção, compartilhamento, exportação, exclusão, anonimização.
**99 Exportação** — `worker.read` não implica `worker.export`.
**100 Bulk operations** — `campaign.send_bulk`, `charge.create_bulk`, `member.update_bulk` exigem autorização específica.
**101 Approval workflows** — maker → checker para operações críticas.

## 102–103. VISÕES CONSOLIDADAS

**102 Notification center** interno (tarefas, homologações atrasadas, pagamentos conciliados, integrações com erro, documentos pendentes).
**103 Command center** para a diretoria (associados ativos, novos no mês, arrecadação, inadimplência, atendimentos, homologações, reservas).

## 104–108. SAAS

**104 Configuration over customization** — nunca `if sindicato === SECABC`; preferir setting, rule, configuration, feature_flag, workflow.
**105 Tenant settings** — nome, logo, cores, unidades, categorias, tipos de contribuição, serviços, regras, templates, workflows, permissões.
**106 White label** — `app.sindicatoABC.com.br` ou subdomínio da plataforma.
**107 Control Plane** — quarta visão restrita: tenants, subscriptions, feature flags, usage, health, integrations, support, plans, billing.
**108 Impersonation segura** — autorização elevada, motivo obrigatório, tempo limitado, banner explícito, audit log completo. Nunca acesso silencioso.

## 109–112. COMERCIAL E QUALIDADE

**109 Modelo comercial** — planos CORE / PRO / ENTERPRISE + add-ons (IA, Homologação, Colônia, Jurídico, WhatsApp, Portal Empresa, Portal Trabalhador).
**110 Métricas de produto** — tempo de atendimento; recovery rate; data completeness; self-service rate; DAU/MAU; delivery/read/action.
**111 SLOs** — disponibilidade, latência, erro, fila, processamento. Não definir SLA comercial antes de medir capacidade real.
**112 Definition of Done** — UX, permission, validation, database, audit, events, tests, errors, observability, documentation, security.

## 113. ROADMAP MACRO

```
FASE 0  Discovery          FASE 8   Colônia
FASE 1  Foundation         FASE 9   Jurídico
FASE 2  Core Data          FASE 10  Portal Trabalhador
FASE 3  Atendimento        FASE 11  Portal Empresa
FASE 4  Agenda             FASE 12  AI Layer
FASE 5  Financeiro         FASE 13  BI / Intelligence
FASE 6  Comunicação        FASE 14  Productização
FASE 7  Homologações       FASE 15  Segundo Sindicato
```

## 114. O SEGUNDO SINDICATO É UM MARCO DE ARQUITETURA

O verdadeiro teste não será o SECABC funcionando, e sim conseguir cadastrar o segundo sindicato sem criar fork de código. Nesse momento saberemos se tenancy funciona; configurações funcionam; permissões são flexíveis; workflows são genéricos; regras não estão hardcoded; infraestrutura é replicável.

## 115. PRINCÍPIO DE PRODUTO

Toda solicitação do SECABC passa pela pergunta: *isso é necessidade sindical ou particularidade operacional do SECABC?*

- Necessidade sindical → **CORE**
- Variável entre sindicatos → **CONFIGURATION**
- Específica → **EXTENSION / FEATURE FLAG**
- Evitar → **CUSTOM CODE**

## 116. EMENTA RESUMIDA — 12 DISCIPLINAS

I Produto · II Domínio · III Arquitetura · IV Dados · V Segurança · VI UX · VII Backend · VIII Frontend · IX Integrações · X Inteligência · XI Quality Engineering · XII SaaS.

## 117. OBJETIVO FINAL

Ao término, não deverá existir "um software feito para o SECABC", mas uma plataforma tecnológica vertical especializada no mercado sindical — capaz de atender de uma entidade pequena a estruturas com dezenas de milhares de trabalhadores, múltiplas unidades, centenas de funcionários e operações financeiras complexas.

## 118. DEFINIÇÃO DO PRODUTO EM UMA FRASE

> **A infraestrutura digital que conecta trabalhador, empresa e sindicato em uma única plataforma operacional, financeira, relacional e inteligente.**

## 119. REGRA DE FUNDAÇÃO

```
PROCESSO → DOMÍNIO → DADO → REGRA → PERMISSÃO
→ EVENTO → API → UX → TESTE → OBSERVABILIDADE
```

Nunca o inverso. O projeto deve começar pelo modelo operacional e pelo modelo de domínio, e não pelas telas.
