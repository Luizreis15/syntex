# Porta de pagamento Syntex ↔ Veramo

## Contrato

`@syntex/payments` define `PaymentGateway`:

| Método | Papel |
|---|---|
| `createIntent` | Emite PIX/boleto no provider |
| `syncStatus` | Consulta status no provider |

Providers: `stub` · `asaas` (Lote 5) · `itau_bolecode` (Lote 6).

## Env Asaas

```
ASAAS_API_KEY=...
ASAAS_SANDBOX=true
ASAAS_WEBHOOK_TOKEN=...   # header asaas-access-token
```

`tenant.default_charge_provider = 'asaas'` ativa o adaptador. Sem `ASAAS_API_KEY`, a factory falha de forma explícita.

## Env Itaú — só via `itau-bridge-veramo` (Railway)

O Syntex **não** embute certificado mTLS nem chama a API Itaú direto.
Toda conexão real é o mesmo bridge do Veramo (`itau-bridge-veramo` no Railway):

```
ITAU_REAL_CHARGE_ENABLED=true
BRIDGE_URL=https://<serviço-railway>/   # itau-bridge-veramo
BRIDGE_ACCESS_TOKEN=...
ITAU_WEBHOOK_TOKEN=...                  # header x-itau-webhook-token ou ?token=
```

Sem `ITAU_REAL_CHARGE_ENABLED=true` (ou sem `BRIDGE_*`) → mock determinístico (DEV/testes).

Config por tenant (não secret): `itau_beneficiario_id`, `itau_pix_key`, `itau_carteira_code`.
Empresa pagadora precisa de endereço para emissão real.

## Mapeamento Veramo → Syntex

| Veramo | Syntex |
|---|---|
| `unions.default_charge_provider` | `tenant.default_charge_provider` |
| `charges.provider` | `charge.provider` |
| `charges.provider_charge_id` | `charge.provider_charge_id` |
| `charges.billing_type` PIX/BOLETO | `charge.billing_type` pix/boleto |
| `charges.pix_copy_paste` | `charge.pix_copy_paste` |
| `charges.boleto_url` / `codigo_barras` | `charge.boleto_url` / `barcode` |
| Edge `create-asaas-charge` / `create-itau-charge` | Adaptadores `AsaasPaymentGateway` / `ItauBolecodePaymentGateway` |
| Webhooks `asaas-webhook` / `itau-*` | `POST /api/webhooks/payments/:provider` + `payment_webhook_event` (idempotente) |

## Regras

- Domínio Syntex **não** importa SDKs de banco — só a porta.
- Webhook: `unique (tenant_id, provider, external_event_id)` — reprocessamento é no-op.
- Baixa: `settle_charge(..., payment_method)` grava ledger + outbox na mesma transação.
- Stub não faz rede; serve testes e DEMO local. Asaas e Itaú (mock) nos Lotes 5–6; bridge real com `ITAU_REAL_CHARGE_ENABLED`.
