# ADR-008 — Autorização em app-layer, RLS defensiva

- Status: aceita
- Data: 2026-08-18

## Contexto

Autorização sindical não é binária: depende de role, de permissão granular (`company.read` ≠ `company.write`) e de escopo (`own`/`branch`/`department`/`tenant`/`global`). Modelar isso inteiramente em RLS SQL levaria a policies com lógica de negócio duplicada em dois lugares (SQL e aplicação), que divergem com o tempo — exatamente o risco que o CLAUDE.md nomeia.

## Decisão

**RLS carrega só isolamento de tenant.** Toda policy de tabela de tenant segue o mesmo padrão:

```sql
using (tenant_id in (select app_current_tenant_ids()))
```

Simples, barata, e é a garantia que nunca pode falhar — não há regra de negócio para divergir.

**A autorização rica (role → permission → scope) vive em `packages/permissions`**, tipada e testada isoladamente (`tests/permission-matrix.test.ts`, sem dependência de banco). A função `can(grants, permission, tenantId, resource, userId)`:

1. Nega se `resource.tenantId` não bate com o tenant do usuário (checagem redundante com a RLS, mas explícita e testável sem precisar de banco).
2. Nega se nenhuma role do usuário tem a permissão pedida.
3. Nega se o escopo da role concedida não cobre o recurso (`branch` exige `branchId` igual; `own` exige `ownerId` igual ao usuário; `department` nunca é satisfeito nesta fatia — não existe tabela `department` ainda).

Toda rota de API resolve a sessão (`requireSession`) e então checa a permissão no recurso concreto (`checkPermission`) — nunca a permissão "no vácuo", porque o escopo só é decidível depois de saber a que branch/dono o recurso pertence.

`service_role` nunca é usado no caminho da aplicação web — só em scripts server-only (`scripts/seed.ts`) e nos testes que precisam popular fixtures cross-tenant. Isso está imposto no código: `packages/database/src/admin.ts` tem aviso explícito de uso proibido em rota, e nenhuma rota importa esse módulo.

## Consequências

- Uma tabela nova de tenant só precisa de uma policy (a de isolamento) para estar em conformidade — a autorização fina se escreve em TypeScript, não em SQL novo.
- Adicionar uma permissão nova é editar `PERMISSIONS`/`ROLE_PERMISSIONS` em `packages/permissions`, não escrever uma migration.
- Se RLS e a checagem em app-layer algum dia discordarem, RLS sempre vence por ser mais restritiva (isolamento de tenant é a garantia de fundo) — a app-layer só pode negar mais, nunca liberar o que RLS já bloqueou.
- `audit_log` é a exceção que confirma a regra: seu trigger de append-only (`audit_log_forbid_mutation`) *é* regra de negócio em SQL, deliberadamente — porque a garantia de imutabilidade do log não pode depender de nenhuma policy futura ser escrita certo. Ele libera `service_role` (equivalente a DBA, já ignora RLS) e bloqueia todo o resto, aplicação incluída.
