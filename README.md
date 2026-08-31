# Syntex

Plataforma SaaS multi-tenant de gestão sindical. Ver [CLAUDE.md](./CLAUDE.md) para os invariantes arquiteturais e `fundacao/` para o contexto de produto.

Esta primeira fatia entrega o **Union Domain**: dado um CNPJ e uma data, o sistema responde qual sindicato representa a empresa, com que status, sob qual CCT, e com base em qual evidência.

## Estrutura

```
apps/web            → Next.js (App Router) — UI + API routes
packages/database    → cliente Supabase + tipos gerados do schema
packages/permissions → matriz role × permission × scope
packages/types       → tipos de domínio compartilhados
packages/validation  → schemas Zod
supabase/migrations  → migrations SQL, aplicadas via Supabase CLI
decisoes/            → ADRs
```

## Pré-requisitos

- Node.js ≥ 20
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- Uma conta Supabase com acesso ao projeto DEV do Syntex

## Rodando localmente

```bash
npm install

# copie os exemplos e preencha com as credenciais do projeto DEV
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local

# aplica as migrations no projeto DEV linkado
npm run db:push

# popula dados de exemplo (tenant SECABC, unidades, empresas fictícias)
npm run db:seed

npm run dev
```

Abra http://localhost:3000.

## Testes

```bash
npm run test:unit  # Vitest sem Supabase (CI)
npm run test       # Vitest — unit + integração (precisa DEV)
npm run test:e2e   # Playwright
npm run typecheck
```

CI (GitHub Actions): `typecheck` + `test:unit` em push/PR.
## Ambientes

O projeto Supabase apontado por `.env.local` é **DEV**. Produção é um projeto Supabase separado, criado quando houver contrato assinado com o cliente fundador. Nunca aponte código para produção a partir deste repositório sem trocar as credenciais explicitamente.
