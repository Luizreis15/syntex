# Roadmap de execução — Syntex

Owner: agente Cursor neste repositório  
Base: ADR-013 · Blocos A (relação) → C (arrecadação) → B (atores)  
Atualizado: 2026-08-20

Agentes bancários (Veramo: Asaas / Itaú Bolecode) entram no **Lote 2–3** via porta `PaymentGateway`, não como reescrita.

---

## Lote 1 — Travar escopo + CCT aplicável (A2)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 01–10 | ADR-013, nav limpa, resolveAgreement, UI convenções, checkpoint | feitas |

---

## Lote 2 — Regra → obrigação → cobrança manual (A3 + C1–C3)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 11 | Motor/validação de `contribution_rule` (CRUD + vigência) | feita |
| 12 | UI editar regras na CCT | feita |
| 13 | Schema `obligation` + snapshot JSONB imutável | feita (`0012`) |
| 14 | Gerar obrigação da competência (empresa, regra, valor) | feita |
| 15 | Schema `charge` + estados | feita |
| 16 | Tela cobrança backoffice + baixa manual | feita |
| 17 | Subledger `journal_entry` / `journal_line` na baixa | feita |
| 18 | Outbox nos writes financeiros | feita |
| 19 | Testes isolamento + snapshot imutável | feita |
| 20 | Checkpoint Lote 2 | feita |

---

## Lote 3 — Porta bancária + stub (C4–C5)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 21–30 | PaymentGateway, stub, webhook, intent, sync, ADR-014 | feitas |

---

## Lote 4 — Trabalhador + filiação (A4–A5)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 31 | Schema `person` (pessoal, CPF único/tenant) | feita (`0014`) |
| 32 | Schema `worker` | feita |
| 33 | Schema `employment_relationship` temporal | feita |
| 34 | Schema `membership` sensível (tabela separada) | feita |
| 35 | Permissões worker/membership | feita |
| 36 | Domínio create + resolveMembership | feita |
| 37 | API workers + memberships | feita |
| 38 | UI `/trabalhadores` lista/novo/ficha | feita |
| 39 | Nav + audit em leitura de filiação | feita |
| 40 | Testes LGPD/classificação/temporal/CPF | feita |

---

## Lote 5 — Resolve “o que deve” + Asaas (A6 + C6)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 41 | `resolveCompanyDues` (empresa + competência → regras) | feita |
| 42 | API `GET/POST /api/dues` | feita |
| 43 | UI `/cobrancas/resolver` | feita |
| 44 | Migration `0015` (`asaas_customer_id`, `payment_link`) | feita |
| 45 | `AsaasPaymentGateway` + event-map (Veramo) | feita |
| 46 | Webhook Asaas (`asaas-access-token`) | feita |
| 47 | Intent persiste customer + payment_link | feita |
| 48 | Env `ASAAS_*` + README porta | feita |
| 49 | Testes resolve-dues + asaas mock | feita |
| 50 | Checkpoint Lote 5 | feita |

---

## Lote 6 — Itaú SECABC + staff (C7 + B0)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 51 | Migration `0016` config Itaú + endereço + nosso_numero | feita |
| 52 | `ItauBolecodePaymentGateway` (bridge + mock) | feita |
| 53 | Webhook Itaú + match por nosso_numero | feita |
| 54 | Wiring intent/sync + env `ITAU_*`/`BRIDGE_*` | feita |
| 55 | Migration `0017` department + staff_invite | feita |
| 56 | Escopo `department` em permissions + session | feita |
| 57 | API `/api/staff` (setor + convite) | feita |
| 58 | UI `/equipe` | feita |
| 59 | Testes Itaú + staff | feita |
| 60 | Checkpoint Lote 6 | feita |

---

## Lote 7 — Platform + masters (B1–B3)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 61 | Migration `0018` platform_admin + escopo company | feita |
| 62 | Role `company_master` + permissions platform/company.master | feita |
| 63 | `provisionTenantWithMaster` | feita |
| 64 | `createCompanyWithMaster` + invite token | feita |
| 65 | API `/api/platform/tenants` | feita |
| 66 | API `/api/companies/with-master` | feita |
| 67 | UI `/platform` + `/empresas/nova-com-master` | feita |
| 68 | Session grants com companyId + filtro lista | feita |
| 69 | Seed platform admin + testes | feita |
| 70 | Checkpoint Lote 7 | feita |

---

## Lote 8 — Portal empresa + pagamento (B4 + C8)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 71 | Role `company_user` + `finance.pay` / `company.user.invite` | feita |
| 72 | Migration `0019` permissões portal | feita |
| 73 | Superfície `/empresa` (lista cobranças) | feita |
| 74 | Detalhe + pagar guia (intent PIX/boleto) | feita |
| 75 | Sync sem force pago no portal | feita |
| 76 | Convite company_user (`/empresa/equipe`) | feita |
| 77 | Intent/sync autorizam por companyId | feita |
| 78 | Redirect `/inicio` (platform/empresa/sindicato) | feita |
| 79 | Testes portal | feita |
| 80 | Checkpoint Lote 8 | feita |

---

## Lote 9 — Portal associado (B5–B6)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 81 | Migration `0020` person.app_user_id + invite.person_id | feita |
| 82 | Role `associate` + `associate.access.issue` | feita |
| 83 | `issueAssociateAccess` no cadastro | feita |
| 84 | Botão emitir na ficha do trabalhador | feita |
| 85 | Portal `/associado` — conta | feita |
| 86 | Portal — filiação (audit sensível) | feita |
| 87 | Portal — cobranças das empresas do vínculo | feita |
| 88 | Redirect `/inicio` + shell | feita |
| 89 | Testes | feita |
| 90 | Checkpoint Lote 9 | feita |

---

## Lote 10 — Escritório / delegação (B7)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 91 | ADR-015 primitivo único de delegação | feita |
| 92 | Migration `0021` office + link + delegation + scope office | feita |
| 93 | Roles `office_master` / `office_user` | feita |
| 94 | Provision escritório + convite master | feita |
| 95 | Vincular empresa → materializa delegações | feita |
| 96 | Convidar office_user → herda empresas | feita |
| 97 | Sessão expande delegações em grants company | feita |
| 98 | Backoffice `/escritorios` | feita |
| 99 | Portal `/escritorio` multi-empresa | feita |
| 100 | Checkpoint Lote 10 | feita |

---

## Lote 11 — Control plane rico (fatia 1)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 101 | Emenda ADR-013 — descongelar control plane | feita |
| 102 | Layout `/platform` com nav | feita |
| 103 | Dashboard leve (contagens) | feita |
| 104 | `/platform/tenants` lista + cadastro | feita |
| 105 | `/platform/tenants/[id]` detalhe | feita |
| 106 | Config gateway no detalhe (provider + Itaú) | feita |
| 107 | API PATCH tenant (platform) | feita |
| 108 | `/platform/cobrancas` leitura cross-tenant | feita |
| 109 | Testes platform control plane | feita |
| 110 | Checkpoint Lote 11 | feita |

---

## Congelado (não entra em lote até ADR emendar)

Prompt 02.1 demo · menu-fantasma · seed cosmético · workflow engine · tesouraria · IA  
Próximas fatias do control plane (métricas densas, notificações, cancelamentos) entram em Lote 12+

---

## Lote 12 — Control plane ops (métricas · cancel · inbox)  ← FEITO

| # | Etapa | Status |
|---|---|---|
| 111 | Migration `0023` cancel_charge + platform_notification | feita |
| 112 | Domínio cancel + notificação | feita |
| 113 | Métricas densas no dashboard | feita |
| 114 | UI cancelar em `/platform/cobrancas` | feita |
| 115 | `/platform/notificacoes` inbox | feita |
| 116 | APIs cancel + notifications | feita |
| 117 | Nav Notificações | feita |
| 118 | Testes | feita |
| 119 | Tipos | feita |
| 120 | Checkpoint Lote 12 | feita |

---

## Congelado (não entra em lote até ADR emendar)

Prompt 02.1 demo · menu-fantasma · seed cosmético · workflow engine · tesouraria · IA
