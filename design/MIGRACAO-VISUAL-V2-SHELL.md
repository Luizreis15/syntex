# Plano de migração visual v2 — Fase 1 (App Shell)

**Referência:** https://github.com/Luizreis15/syntex-vital-core (`AppShell.tsx`, `styles.css`)  
**Alvo:** `apps/web` — arquitetura Syntex soberana; Lovable soberano só no visual.

## Diagnóstico do trabalho Claude (WIP local, não commitado)

| Feito | Problema |
|-------|----------|
| Tokens oklch em `globals.css` (paper/petrol/teal/shell) | `design/SYNTEX-UI.md` ainda descreve v1 (bege/serifa) |
| Manrope + JetBrains Mono em `layout.tsx` | ADR-017 citado em comentários, arquivo inexistente |
| Nav 7 grupos + `built` flag | Sidebar trata `icon: string` como componente → **typecheck quebrado** |
| Topbar: Competência + Unidade + Bell + User | Active state incompleto vs Lovable (falta tint syntex) |
| `lucide-react` adicionado | Justificável (iconografia da referência); não copiar shadcn UI pack |
| Remoção `syntex-asof-bar` → `SyntexCompetenceScope` | URL `?competencia=` preservada — OK |

## Princípio

Visual Lovable · Engenharia Syntex. Sem migrations, sem APIs, sem redesenho de `/painel`/`/empresas` nesta fase.

## Passos de implementação (esta entrega)

1. Atualizar `design/SYNTEX-UI.md` → Visual System v2 (estética nova; invariantes de produto preservados).
2. Escrever `decisoes/ADR-017-navegacao-mapa-produto.md` (menu fantasma `built:false` vs ADR-013).
3. Corrigir `sidebar.tsx`: mapa `NAV_ICON` lucide; active rail teal + tint; brand mark.
4. Afinar topbar (altura 64, pills, command permission-aware intacto).
5. Completar tokens utilitários se faltarem (`surface-command` opcional só se necessário no shell).
6. Typecheck + testes; **parar** — sem Dashboard novo.

## Fora desta fase

Dashboard hero-dark, Empresa 360, Trabalhador 360, mocks Lovable, shadcn default pack.

## Pendências registradas (aprovação Fase 1)

Ver também ADR-017 § Pendências:

1. Itens `built: false` — só em desenvolvimento; produção deve ocultar ou usar feature/module availability.
2. Remoção do `SyntexAsOfBar` não apaga “vigente em”; competência ≠ data de vigência — redefinir nas telas temporais.
3. P0 segurança: `platform_notification` sem RLS (pré-existente; fora desta migração).
