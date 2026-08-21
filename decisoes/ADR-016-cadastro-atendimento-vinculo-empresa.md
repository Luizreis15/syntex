# ADR-016 — Cadastro vs Atendimento e vínculo trabalhador↔empresa

## Status

Aceito (2026-08-21).

## Contexto

No sindicato, duas áreas operam a relação com pessoas e empresas de formas distintas:

| Área | Analogia | Cuida de |
|------|----------|----------|
| **Cadastro** | Faturamento / contas a receber | Empresas do setor, validação, guias, cobranças, débitos, vínculos empregatícios |
| **Atendimento** | Relacionamento / sócios | Filiação (associação), benefícios, carta de oposição, mensalidade (PIX/carnê), portal do associado |

A UI misturava “Unidade” (branch do sindicato, ex. nome “Sede”) com sede/matriz da empresa, e permitia cadastrar trabalhador sem empresa.

## Decisão

1. **Trabalhador sem empresa não se cadastra** no fluxo operacional. O create exige `companyId` e grava `employment_relationship` na mesma operação. `worker` continua sem `company_id` (vínculo temporal — fundação §8).
2. **Unidade sindical** (`branch`) ≠ estabelecimento da empresa (`establishment` matriz/filial). Labels e help text deixam isso explícito. Se `branchId` omitido, herda `company.branch_id`.
3. **Filiação** (`membership`) é domínio Atendimento: opcional no cadastro inicial; associação plena pressupõe vínculo empregatício vigente + regras de negócio (setor + ausência de carta de oposição — a modelar quando entrevistarmos Atendimento).
4. No momento da associação, a UI lista **empresas** para confirmar/vincular o trabalhador — não “unidade sede” do sindicato como se fosse empregador.

## Consequências

- Schema Zod/`createWorkerWithPerson`: `companyId` obrigatório.
- Formulário `/trabalhadores/novo`: bloco Empresa primeiro; filiação rotulada como Atendimento.
- Próximos painéis: Cadastro foca empresa/guias; Atendimento foca sócio + benefícios + mensalidade, sempre amarrado ao employment.
- Carta de oposição ainda não tem tabela — registrar no discovery com o time de Atendimento antes de schema.

## Ver também

Checklist nuvem: `fundacao/06-ambiente-nuvem-dev.md`.
