# Syntex — Fundação

Índice dos documentos de fundação. Atualizado em 18/08/2026.

**Estágio atual:** nenhum código escrito, discovery não iniciado, equipe/orçamento não declarados.
**Status da fundação:** conceitualmente madura, **não fechada**. Há sete blocos estruturais faltando (doc 03) e quatro decisões de negócio pendentes (doc 02) que devem ser resolvidas antes do primeiro commit.

---

## Documentos

| # | Arquivo | O que é |
|---|---------|---------|
| 01 | `01-documento-de-fundacao-v1.md` | Documento canônico de visão, domínios, arquitetura, fases e critérios. 119 seções. Anotado com as ressalvas levantadas nos docs 02 e 03. |
| 02 | `02-revisao-critica.md` | Revisão crítica de negócio e sequenciamento: riscos que podem matar o projeto, ordem de fases, lacunas regulatórias. |
| 03 | `03-triagem-revisao-arquitetural.md` | Triagem dos 18 pontos da revisão arquitetural por **irreversibilidade**: o que entra no schema agora, o que vira ADR, o que fica no mapa, o que resistir. |

Leia na ordem 01 → 02 → 03. O doc 03 é o mais acionável.

---

## Estado das decisões

### Bloqueando o primeiro commit — negócio (doc 02)

- [ ] Equipe, orçamento mensal, meses de pista e prazo-alvo por fase — **nada disso está escrito hoje**
- [ ] Contrato com o SECABC: quem paga, propriedade intelectual, exclusividade, cláusula de saída e destino dos dados
- [ ] ADR-000 — o produto opera sobre dado pessoal sensível (filiação sindical, saúde, jurídico): base legal por tratamento, papéis controlador/operador, subprocessadores, residência de dados
- [ ] Validação de mercado: 5–10 conversas com sindicatos que não o SECABC, sobre **preço e decisor**, não sobre funcionalidade

### Bloqueando o primeiro commit — schema (doc 03, balde A)

Itens irreversíveis. Se descobertos no mês 9, são reescrita e não `ALTER TABLE`:

- [ ] **Union Domain** — representação, território, categoria econômica e profissional, CCT/ACT, regra de contribuição
- [ ] **Regras temporais** — `valid_from`/`valid_until` + snapshot imutável da regra aplicada em cada obrigação gerada
- [ ] **Multi-tenancy** — FK composta com `tenant_id`, uniques por tenant, contexto de tenant em jobs
- [ ] **Transactional Outbox** — sem ele, evento se perde entre commit no Postgres e publish no Redis
- [ ] **Primitivo de delegação no IAM** — contador/procurador, representante de empresa e impersonation de suporte são a mesma coisa
- [ ] **Classificação de dado** + dado de saúde e jurídico em tabela separada, não coluna
- [ ] **`department` / `team` / `staff`** — o escopo `department` da seção 37 é hoje inimplementável
- [ ] **Subledger de partida dobrada** — `journal_entry` + `journal_line`, invariante débito = crédito no banco

### ADRs a escrever (doc 03, balde B)

- [ ] ADR-007 — Residência de dados dos workers (Railway não tem região na América do Sul)
- [ ] ADR-008 — Autorização: RLS defensiva + app-layer primária + política de `service_role`
- [ ] ADR-009 — Fronteira OLTP × analytics
- [ ] ADR-010 — Mobile: PWA responsivo primeiro
- [ ] ADR-011 — Governança de IA, com permission-aware retrieval
- [ ] ADR-012 — Resposta a incidente e obrigações de operadora (ANPD: 3 dias úteis para o controlador)

### Resistir conscientemente

Workflow engine genérico · Tesouraria e contas a pagar (integrar, não construir) · Plataforma de integração antes do segundo provedor · Model registry antes da Fase 12

---

## Pendência de nomenclatura

O produto aparece como **"Veramo Sindicato OS"** no doc 01 e como **Syntex** no projeto. Isso vai parar em contrato, domínio, repositório e `package.json`. Decidir antes de qualquer um deles.

---

## Próximo passo proposto

**Adendo estrutural + ERD**, cobrindo os sete blocos novos do balde A. Não uma v2 do documento inteiro — 75–80% do doc 01 permanece válido, e reescrevê-lo consome dias sem produzir decisão. Adendo e ERD devem sair juntos: o Union Domain só fica honesto quando vira tabela.

Antes disso, porém, os quatro itens de negócio acima. Nenhum leva mais que duas semanas e qualquer um deles pode invalidar decisões que o adendo tomaria.
