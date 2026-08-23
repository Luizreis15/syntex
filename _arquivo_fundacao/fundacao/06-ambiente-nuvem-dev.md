# Ambiente de nuvem (DEV) — checklist operacional

Objetivo: testar o Syntex em `https://syntex.veramo.com.br` com o mesmo ritmo de push → deploy → smoke test. Projeto Supabase atual: **syntex-dev** (`bsacszrmjueqfjhavkbi`). Produção será outro projeto.

## 1. Vercel — variáveis (Production + Preview)

Login e logout usam **Server Action** (env de **runtime**). Mesmo assim o painel precisa
ter as envs no **projeto certo** (Settings → Environment Variables do app que faz deploy
de `syntex.veramo.com.br`).

| Variável | Obrigatória | Notas |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | `https://bsacszrmjueqfjhavkbi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | chave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | sim* | *`/platform`. Nunca no client. |
| `RESEND_API_KEY` | não | e-mail |
| `ASAAS_*` / `BRIDGE_*` / `ITAU_*` | não | stub se vazios |

Se o build log mostrar `NEXT_PUBLIC_SUPABASE_*: AUSENTES`, as envs **não estão neste projeto**
(ou há filtro por branch). Apague e recrie URL + ANON no projeto do domínio, Production + Preview,
depois Redeploy.

Root do monorepo: install na raiz; build `npm run build --workspace=web`.

## 2. Supabase Auth — URLs do domínio

Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://syntex.veramo.com.br`
- **Redirect URLs:** `https://syntex.veramo.com.br/**` e `https://*.vercel.app/**`

## 3. Banco alinhado ao código

```bash
npx supabase db push   # syntex-dev linkado
```

## 4. Smoke pós-deploy

1. `/login` → platform admin → `/platform`
2. Provisionar sindicato → login master → `/empresas`

## 5. Checkpoints

```bash
git tag -a cloud-YYYYMMDD-N -m "checkpoint: …"
git push origin cloud-YYYYMMDD-N
```
