# Triagem da Revisão Arquitetural — Syntex

Resposta à análise de 18 pontos · 18/08/2026 · Estágio: nenhum código, discovery não iniciado

---

## 1. Veredito sobre a revisão

**É uma boa revisão e o ponto 1 sozinho já justifica ela ter existido.** O Union Domain é o gap real da fundação, e nem o documento original nem a minha revisão o nomearam corretamente — eu tratei CCT, Mediador e categoria como *lacuna de integração* (item C2), quando na verdade são *lacuna de domínio*. É diferente. Integração você adia; domínio ausente você paga em migração.

Duas notas de contexto antes do mérito:

- A revisão chama o documento de fundação de "documento do Claude". Ele é seu — eu produzi a revisão crítica, não a fundação. Isso importa só para calibrar o "8/10": ele está avaliando o seu documento, não o meu, e a nota é sobre a mesma base que eu avaliei.
- **Onde as duas revisões convergiram sem se conhecer, confie:** LGPD com filiação sindical como dado sensível, e "não construa workflow engine genérico agora". Duas leituras independentes chegando ao mesmo lugar é o sinal mais forte que você vai ter. Onde divergimos é onde vale olhar com atenção — listo no item 4.

**A crítica que eu faço à revisão é de custo, não de conteúdo.** Ela abre com "eu ainda não daria `go` para desenvolvimento" e então adiciona 18 requisitos arquiteturais, 10 deles marcados P0, a um projeto com zero linhas de código, equipe não declarada, orçamento não declarado e tese de mercado não validada. Se todos os 10 P0 forem pré-requisito do primeiro commit, o `go` sai de meses para trimestres — e o risco número um deste projeto nunca foi arquitetura ruim, é ficar sem pista antes de entregar algo que alguém pague.

Arquitetura não é o gargalo. Capacidade é. E ninguém ainda escreveu quanta capacidade existe.

Por isso a minha resposta não é "concordo" nem "discordo" — é **retriar os 18 por um critério só: irreversibilidade.**

> Não se pergunta "isso é importante?". Tudo na lista é importante.
> Pergunta-se: **"se eu descobrir isso no mês 9, é um `ALTER TABLE` ou é uma reescrita?"**

O que for reescrita entra agora. O que for `ALTER TABLE` entra quando doer.

---

## 2. O Union Domain é maior do que a revisão diz

Concordo integralmente com o ponto 1, e ele está subdimensionado. O diagrama proposto assume que a representação sindical é um fato limpo — empresa tem CNAE, CNAE mapeia para categoria, categoria mapeia para sindicato. **No Brasil não é assim.**

O que o modelo precisa suportar e o diagrama não prevê:

- **Representatividade é disputada.** Conflito de base entre sindicatos é rotina, não exceção. `UnionRepresentation` não pode ser uma atribuição determinística — precisa de `status` (reivindicada, reconhecida, disputada, perdida), `evidence` e histórico. Uma empresa pode ser cobrada por dois sindicatos simultaneamente e o sistema precisa representar isso sem corromper o financeiro.
- **CNAE → categoria não é determinístico.** É interpretação, e é negociada. O sistema precisa registrar *quem decidiu* o enquadramento e *com base em quê*, não apenas o resultado.
- **A base legal da representação é o registro sindical / carta sindical no MTE**, com base territorial e categoria descritas. Isso é entidade, não atributo.
- **Unicidade sindical** (art. 8º, II da CF) é uma invariante do domínio: um sindicato por categoria por base territorial. Vale modelar como restrição, porque é ela que gera o conflito acima quando violada na prática.
- **Data-base e vigência de CCT não coincidem** com ano civil nem entre si. Toda regra derivada precisa de vigência própria, não herdada.

Ou seja: o Union Domain não é "mais seis tabelas". É o domínio onde mora a ambiguidade do negócio — e é exatamente por isso que ele é o fosso competitivo. Um ERP genérico não modela disputa de representatividade porque não sabe que ela existe.

**Consequência prática que junta os dois reviews:** se o Union Domain é o core, a primeira fatia vertical muda. Não é "cadastrar associado". É:

```
empresa → representação vigente → CCT aplicável → regra de contribuição
→ obrigação da competência → cobrança → conciliação → baixa
```

Essa é a espinha diferenciada. Ela resolve o meu item B1 (financeiro tarde demais) e o ponto 1 dele ao mesmo tempo, e produz na Fase 1 algo que nenhum concorrente genérico faz.

---

## 3. Triagem dos 18 pontos

### Balde A — Entra no schema antes do primeiro commit (irreversível)

| # | Item | Por que é irreversível |
|---|---|---|
| 1 | **Union Domain** | Tudo pendura nele. Retrofit = remodelar empresa, financeiro e obrigações. |
| 2 | **Regras temporais + snapshot da regra na obrigação** | Sem snapshot, guias emitidas viram irreprodutíveis. Não há como reconstruir depois. |
| 3 | **Multi-tenancy com FK composta** | Ver nota abaixo — é a única defesa real contra vazamento cross-tenant. |
| 7 | **Transactional Outbox** | Retrofit exige reprocessar histórico de eventos que você não tem. |
| 10 | **Primitivo de delegação no IAM** | Ver nota abaixo — delegação retrofitada em auth é a pior refatoração que existe. |
| 5 | **Classificação de dado + dado sensível em tabela separada** | Separar coluna de tabela depois é migração com downtime e reescrita de policy. |
| 9 (parcial) | **`department` / `team` / `staff`** | O escopo `department` da seção 37 é hoje **inimplementável** — a entidade não existe. |
| — | **Subledger de partida dobrada** | Ver nota abaixo — discordo do "não precisa no MVP". |

**Nota sobre #3 — o que falta na especificação de multi-tenancy dele.** A lista está boa mas omite a defesa mais forte: **chave estrangeira composta incluindo `tenant_id`**. `UNIQUE (id, tenant_id)` no pai e `FOREIGN KEY (parent_id, tenant_id)` no filho faz o *banco* recusar uma referência cross-tenant. RLS protege leitura; FK composta protege integridade — e o vazamento clássico em schema compartilhado é justamente um FK apontando para outro tenant, que RLS não impede. Custa nada se feito no dia 1 e é impraticável depois de 200 tabelas.

**Nota sobre #10 — delegação é um primitivo, não três features.** Ele está certo que contador representando 500 CNPJs precisa nascer no IAM. O que ele não nota é que **três coisas do documento são o mesmo primitivo**:

- contador/procurador representando empresas (ponto 10),
- dependente ou terceiro gerindo a conta de um associado,
- impersonation do suporte Veramo (seção 108 da fundação).

Todas são: *principal A age em nome do sujeito B, com escopo S, válido de T1 a T2, com motivo M e trilha de auditoria*. Modele uma vez. Se modelar três vezes, a terceira vai ter um bug de autorização.

**Nota sobre o ledger — eu vou além dele.** A correção conceitual está certa: a seção 17 mistura event log com ledger, e são coisas distintas. Mas discordo do "não precisamos de partida dobrada no MVP". Um sistema com split de pagamento, estorno, taxa de gateway e repasse a prestador **precisa** de partidas dobradas, e o custo é baixo: duas tabelas (`journal_entry`, `journal_line`) e uma invariante checada no banco (soma de débitos = soma de créditos por transação). O custo de *não* ter isso aparece no primeiro estorno parcial com split, e aí você reconstrói o histórico financeiro inteiro. Construa no MVP.

### Balde B — ADR antes do primeiro commit (decisão, não construção)

Custam um dia cada e evitam decisão implícita:

- **ADR-007 — Residência de dados dos workers** (#6). Ver item 4.
- **ADR-008 — Autorização: RLS defensiva + app-layer primária + política de `service_role`** (#4, meu C4). Os dois reviews convergem aqui por caminhos diferentes: se o worker precisa de credencial elevada de qualquer forma, RLS não pode ser a única fonte de verdade da autorização. RLS carrega isolamento de tenant (simples, barato, e o que nunca pode falhar); a autorização rica vive na aplicação, tipada e testável. Workers recebem conexão com contexto de tenant, nunca `service_role` genérica.
- **ADR-009 — Fronteira OLTP × analytics** (#14). Read models e materialized views agora, CDC depois. Só precisa estar escrito.
- **ADR-010 — Mobile: PWA responsivo primeiro** (#18).
- **ADR-011 — Governança de IA, com permission-aware retrieval** (#13). O ponto afiado dele: RAG não pode recuperar documento que o usuário não abriria. Detalhe técnico que ele não dá — **filtre na recuperação, não nos resultados**. Pós-filtro vaza pela existência do chunk. E não misture embeddings de tenants diferentes no mesmo índice.
- **ADR-012 — Resposta a incidente e obrigações de operadora** (#15). Ver item 4 para a correção factual.
- **Portas de integração** (#12), apenas a forma da interface — ver item 4.

### Balde C — No mapa do produto, fora do escopo comprometido

Fiscalização (#11) · Benefícios e convênios como domínio (#17) · RH completo além de org structure (#9) · Maquinaria da plataforma de integração: circuit breaker, health, versionamento (#12).

Todos legítimos. Nenhum precisa existir antes do segundo sindicato.

### Balde D — Resistir

- **Workflow engine genérico** (#16) — ele mesmo recomenda resistir, e coincide com o meu item B3. Convergência: siga.
- **Tesouraria / contas a pagar** (#8) — ver item 4. Discordo.
- **Model registry, evals, versionamento de prompt** (#13) — o ADR agora basta; a maquinaria é Fase 12.

---

## 4. Onde eu discordo

### 4.1 Tesouraria e contas a pagar: integrar, não construir · #8

Ele está certo que o financeiro do documento é todo receita e que o sindicato tem despesa, fornecedor, caixa de sede, centro de custo. É gap real.

Mas construir isso é assumir um módulo de ERP financeiro inteiro — e é **a parte menos diferenciada do produto**. Contas a pagar é problema resolvido por dezenas de fornecedores há vinte anos. Cada mês gasto nisso é um mês não gasto no Union Domain, que é a única coisa que ninguém mais tem.

E note: isso é exatamente o teste da seção 115 da própria fundação. *"Isso é necessidade sindical ou particularidade operacional?"* Contas a pagar é necessidade de **qualquer organização**, não de um sindicato. Pela regra do próprio documento, não vai para o CORE.

**Recomendação:** integração com o sistema contábil/financeiro que o SECABC já usa, e um conector genérico depois. Se o SECABC insistir em ter dentro, isso é escopo pago à parte, não fundação. O argumento "o pedido original do SECABC é maior" é precisamente o que a seção 115 existe para filtrar.

### 4.2 Integration Platform contradiz o ponto 16 dele mesmo · #12

O ponto 16 diz, corretamente, para não construir engine genérica antes de ter 3–5 casos reais. O ponto 12 propõe uma plataforma de adapters com credencial por tenant, webhook assinado, versionamento, retry, rate limit, health status e circuit breaker — **antes de existir uma única integração implementada.** É a mesma armadilha com outro nome.

**Recomendação:** defina agora só a *forma da porta* — que Finance nunca importe o SDK do gateway diretamente, que Comunicação nunca importe o SDK do BSP. Uma interface por categoria, uma implementação cada. A maquinaria (circuit breaker, health, versionamento) entra quando aparecer o **segundo** provedor da mesma categoria, que é quando ela deixa de ser especulação. Portas e adaptadores como disciplina, não como framework.

### 4.3 Column-level security do Postgres é o mecanismo errado · #5

Concordo com a classificação de dados. Discordo do mecanismo.

CLS no Postgres é `GRANT` por role — estático e grosso. Ele não compõe com escopo dinâmico (`own`/`branch`/`department`), que é justamente o modelo da seção 37. Você acaba com uma explosão de roles ou com a regra vivendo em dois lugares divergindo.

**Recomendação:** classificação como metadado + filtragem por campo na camada de serialização da API (testável, versionada, uma fonte de verdade), e **dado de saúde e jurídico em tabelas separadas**, não como coluna sensível em `person`. Tabela separada = policy separada = auditoria trivial = e você consegue responder "quem acessou dado de saúde?" com uma query, em vez de inferir de log de coluna.

Isso conecta com o item seguinte de um jeito que nenhum dos dois reviews notou.

### 4.4 Correção factual no ponto 15 — e o requisito que ele revela

Verifiquei a Resolução CD/ANPD nº 15/2024. O prazo de **três dias úteis** existe e está correto, contado do conhecimento de que o incidente afetou dados pessoais (dobrado para agentes de pequeno porte). Mas: **o regulamento não impõe obrigação direta ao operador** — a responsabilidade de comunicar é do controlador; o operador só é *identificado* na comunicação. O dever do Syntex de entregar os dados ao sindicato nasce do **contrato de tratamento (DPA)**, não da Resolução. Isso muda onde você escreve a obrigação: no contrato, com SLA próprio.

O requisito de produto que isso revela é mais interessante que o processo. A comunicação à ANPD exige, entre outros: **categoria dos dados afetados, número de titulares atingidos, data do incidente e data do conhecimento.**

Traduzindo para schema: em até três dias úteis, o sistema tem que responder *"quais titulares e quais categorias de dado foram expostos neste acesso"*. Isso é impossível se o audit log registra apenas "usuário X leu `person` #4213". Só é respondível se **a classificação de dado do ponto 5 estiver no audit log**.

Ou seja: **os pontos 5 e 15 são o mesmo requisito visto de duas pontas.** Classificação de dados não é higiene de compliance — é o que torna o prazo de três dias cumprível. Isso reforça o balde A e reforça a tabela separada do item 4.3.

### 4.5 O ADR-007 merece ser mais opinativo · #6

Confirmei: o Railway hoje tem quatro regiões — Califórnia, Virgínia, Amsterdã e Singapura. **Nenhuma na América do Sul.** O ponto está correto e é mais forte do que ele apresenta.

Ele sugere avaliar "Railway com payload mínimo/tokenizado versus provedor em São Paulo". Eu seria mais direto: **tokenização aqui é em boa parte teatro.** O `worker-import` processa a planilha de trabalhadores com CPF; o `worker-communication` monta a mensagem com o nome e o débito; o `worker-ai` lê o histórico. Esses workers precisam do dado real para funcionar. O que sobraria para tokenizar é justamente o que não importa.

E há a dimensão comercial que ele não menciona: você vai vender um sistema de dado sensível de filiação sindical para entidades que são, por natureza, politicamente sensíveis a soberania de dados. *"Nossos workers rodam na Virgínia"* não é um item de compliance — é uma objeção de venda, e uma que um concorrente vai usar.

**Recomendação:** mantenha o ADR-007 aberto, mas com viés declarado para workers em São Paulo. A transferência internacional é regulada pela ANPD e viável com cláusulas-padrão, mas você estaria assumindo trabalho jurídico contínuo e uma objeção comercial permanente para economizar conveniência de deploy.

---

## 5. O que nenhuma das duas revisões resolve

Vale dizer com clareza, porque é fácil confundir profundidade arquitetural com progresso:

**Nenhum dos 18 pontos altera os quatro riscos críticos de negócio da revisão anterior.** O mercado sindical perdeu ~97,8% da arrecadação de contribuição desde 2017. Não há contrato com o SECABC definindo quem paga e de quem é o código. Não há equipe, orçamento ou prazo declarados. O comprador tem mandato eletivo de 3–4 anos.

Um Union Domain impecável não muda nada disso. Ele torna o **produto** melhor e mais defensável — e é por isso que concordo com ele. Mas o **negócio** continua no mesmo lugar, e é o negócio que decide se o produto chega a existir.

Os dois documentos devem ser lidos juntos: um diz *o que construir*, o outro diz *se e com o quê construir*. Fazer só o primeiro é como projetar bem uma casa sem saber se o terreno é seu.

---

## 6. Próximo passo concreto

Concordo com a proposta de uma Fundação v2 — com três ajustes:

1. **Não v2 do documento inteiro.** 75–80% do texto atual permanece válido e reescrever consome dias sem produzir decisão. O que falta é um **adendo estrutural**: Union Domain, regras temporais, delegação, outbox, classificação de dados, org structure e subledger. Sete blocos novos, não 119 seções reescritas.
2. **Adendo e ERD juntos, não em sequência.** O Union Domain só fica honesto quando vira tabela. Escrever prosa sobre representatividade disputada e só modelar depois é como o erro vai passar despercebido.
3. **Antes dos dois, os quatro itens do bloco A da revisão anterior** — equipe/orçamento/pista, contrato com o SECABC, ADR-000 de dado sensível, validação de mercado. Nenhum leva mais que duas semanas e todos podem invalidar decisões que o adendo tomaria.

E resolva o nome. O projeto está registrado como **Syntex**, o documento inteiro diz **Veramo**, e a revisão usa os dois. Isso vai parar em contrato, domínio, `package.json` e schema. Decida esta semana.

---

## Fontes

- [Railway — Regions (documentação oficial)](https://docs.railway.com/reference/regions)
- [Resolução CD/ANPD nº 15/2024 — Regulamento de Comunicação de Incidente de Segurança](https://bibliotecadigital.mj.gov.br/bitstream/1/12879/2/RES_ANPD_2024_15.html)
- [ANPD — Comunicação de Incidente de Segurança](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis)
- [LGPD — Lei nº 13.709/2018, art. 5º, II e art. 11](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
