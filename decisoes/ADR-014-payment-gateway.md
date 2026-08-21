# ADR-014 — Porta de pagamento (PaymentGateway)

- Status: aceita
- Data: 2026-08-20

## Contexto

O Veramo já opera Asaas e Itaú Bolecode. O Syntex precisa de arrecadação sem acoplar o domínio a um banco específico, e sem reescrever os agentes.

## Decisão

1. Pacote `@syntex/payments` com interface `PaymentGateway` (`createIntent`, `syncStatus`).
2. Providers: `stub` | `asaas` | `itau_bolecode` — mesmo vocabulário do Veramo + stub.
3. `tenant.default_charge_provider` escolhe o adaptador; a charge guarda o intent (`provider`, `provider_charge_id`, PIX/boleto).
4. Webhooks entram em `POST /api/webhooks/payments/:provider` com idempotência em `payment_webhook_event`.
5. Baixa via `settle_charge(..., payment_method)` — ledger + outbox na mesma transação.
6. Adaptadores Asaas/Itaú **portam** a lógica do Veramo nos Lotes 5–6; não nascem no Lote 3.

## Consequências

- Domínio e UI nunca importam SDK de banco.
- Trocar provider é config de tenant + deploy do adaptador.
- Stub cobre DEV e testes sem rede até o primeiro provider real.
