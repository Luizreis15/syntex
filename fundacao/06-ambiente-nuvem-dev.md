# Ambiente de nuvem (DEV) — checklist operacional

Objetivo: testar o Syntex em `https://syntex.veramo.com.br` com o mesmo ritmo de push → deploy → smoke test. Projeto Supabase atual: **syntex-dev** (`bsacszrmjueqfjhavkbi`). Produção será outro projeto.

## 1. Vercel — variáveis (Production + Preview)

| Variável | Obrigatória | Notas |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | `https://bsacszrmjueqfjhavkbi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | chave anon do dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | sim* | *necessária para `/platform` (listar tenants, provisionar, cobranças cross-tenant). Nunca no client. |
| `RESEND_API_KEY` | não | e-mail; vazio = sem envio |
| `ASAAS_*` / `BRIDGE_*` / `ITAU_*` | não | gateways; stub/mock se vazios |

Depois de criar/alterar **qualquer** `NEXT_PUBLIC_*`: **Redeploy sem Build Cache**.
Essas variáveis são **embutidas no JS no build** — se o deploy anterior rodou sem elas, o client fica com `createBrowserClient("","")` e o login “pensa” para sempre. Confirme no Network: request para `*.supabase.co` (não URL vazia).

Root do monorepo na Vercel: install na raiz; build `npm run build --workspace=web` (ou equivalente).

## 2. Supabase Auth — URLs do domínio

Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://syntex.veramo.com.br`
- **Redirect URLs** (adicione):
  - `https://syntex.veramo.com.br/**`
  - `https://*.vercel.app/**` (previews)

Sem isso, login/password pode autenticar mas redirects/cookies de fluxo OAuth quebram; password-only ainda precisa do Site URL coerente.

## 3. Banco alinhado ao código

Após cada migration no git:

```bash
npx supabase db push   # no projeto linkado (syntex-dev)
```

Confirme que `0024_platform_admin_select_own` (e anteriores) estão no remote antes de testar login de platform_admin.

## 4. Smoke pós-deploy (2 minutos)

1. Abrir `https://syntex.veramo.com.br/login`
2. Entrar com platform admin (`adm@syntex.com.br` ou seed)
3. Deve cair em `/platform`
4. Provisionar um sindicato de teste → login do master → `/empresas`
5. Se “Entrando…” trava: DevTools → Network → falha em `auth/v1/token` (env pública) ou 500 em `/inicio` / `/platform` (falta `SERVICE_ROLE` ou migration)

## 5. Ritmo de salvamento (checkpoints)

Cada fatia estável que você queira “voltar”:

```bash
git tag -a cloud-YYYYMMDD-N -m "checkpoint: …"
git push origin cloud-YYYYMMDD-N
```

Ex.: `cloud-20260821-1` = middleware Edge + login nuvem. Redeploy na Vercel aponta para o commit/tag se precisar rollback.

## 6. O que ainda não é “nuvem completa”

- Workers / filas Railway (webhooks pesados)
- Resend com domínio verificado
- Asaas/Itaú reais (só quando for testar gateway)
- Projeto Supabase de **produção** separado (não apontar este domínio para prod sem intenção)

Para testes de produto agora: Vercel + syntex-dev + Auth URLs + `SERVICE_ROLE` + migrations = suficiente.
