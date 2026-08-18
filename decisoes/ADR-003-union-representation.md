# ADR-003 — Modelagem de `union_representation`

- Status: aceita
- Data: 2026-08-18

## Contexto

O prompt de bootstrap sinalizava duas modelagens defensáveis para representação sindical:

1. **Vínculo direto**: `union_representation` como linha explícita ligando tenant/sindicato a um estabelecimento, com status, vigência, base e evidência — uma afirmação registrada.
2. **Derivação**: nenhuma tabela de vínculo; a representação é computada em tempo de consulta cruzando CNAE do estabelecimento + município contra `union_registration`/`union_territory`.

A especificação de campos dada (`status`, `valid_from`/`valid_until`, `basis`, `evidence`, `decided_by`, `decided_at`) já inclinava para (1) — derivação pura não teria campos como `decided_by`/`evidence`, porque não haveria decisão nem evidência a registrar, só cálculo. Ainda assim, o ponto ficou registrado como decisão estrutural porque a segunda pergunta importa mais: **como representar uma disputa sem corromper o dado?**

## Decisão

`union_representation` é vínculo direto ao **estabelecimento** (não à empresa — ver nota de agregação abaixo), com FK composta para `establishment`. `basis = 'cnae'` é um dos valores possíveis de origem, não o mecanismo de resolução — mesmo uma representação originada por CNAE é uma linha registrada, com autoria, não recomputada a cada consulta.

**Unicidade sindical (CF art. 8º, II)** é modelada como invariante, mas só para o status `reconhecida`:

```sql
exclude using gist (
  establishment_id with =,
  daterange(valid_from, coalesce(valid_until, 'infinity'::date), '[]') with &&
) where (status = 'reconhecida')
```

No máximo uma representação **reconhecida** pode estar vigente por estabelecimento a qualquer instante — essa é a unicidade real que a Constituição exige quando a disputa está resolvida. Representações `reivindicada` e `disputada` **podem se sobrepor livremente**, porque é exatamente isso que uma disputa de base é: duas partes afirmando a mesma coisa ao mesmo tempo. Se o `EXCLUDE` bloqueasse qualquer sobreposição, seria impossível registrar uma disputa — o próprio fenômeno que o domínio precisa capturar.

`resolveRepresentation()` não escolhe entre reivindicações concorrentes: se mais de uma linha está vigente na data consultada, o status agregado vira `disputada` e todas vão em `conflicts[]`, com `representation: null`. Nunca elege uma como resposta.

### Onde um sindicato registra a carta de um rival

Como `union_registration` é tabela de tenant (cada sindicato mantém seu próprio cadastro de cartas relevantes), um tenant pode registrar tanto a própria carta quanto a de um sindicato rival, quando isso for necessário para documentar uma disputa (ex.: evidência de que outro sindicato também reivindica a mesma base). Isso não viola isolamento de tenant — é o mesmo tenant guardando um registro descritivo sobre um terceiro, não uma linha pertencente ao rival.

### Agregação matriz → empresa

A resolução acontece no nível do **estabelecimento**, não da empresa, porque matriz e filiais têm CNAE e município próprios e podem legitimamente ter representações diferentes (testado em `tests/domain-representation.test.ts`). Uma visão agregada por empresa, se necessária no futuro, é uma composição na camada de aplicação sobre os resultados por estabelecimento — não uma tabela nova.

## Consequências

- Toda leitura de "quem representa esta empresa" precisa saber para qual estabelecimento, não só qual empresa.
- Uma UI que mostra só "a representação da empresa" precisa decidir uma regra de agregação (ex.: mostrar a da matriz, ou a pior dentre os estabelecimentos) — não resolvido nesta fatia, deliberadamente fora de escopo.
- Se no futuro for necessário impedir sobreposição também entre `reivindicada`/`disputada` (ex.: uma regra de negócio que hoje não existe), isso é mudança de invariante, não de schema — o `WHERE` do `EXCLUDE` muda, as tabelas não.
