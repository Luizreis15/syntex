# Revisão Crítica — Documento de Fundação Veramo Sindicato OS

Revisão de 18/08/2026 · Estágio do projeto: apenas o documento (nenhum código, discovery não iniciado)

---

## Veredito em uma página

O documento é **claramente acima da média** para um projeto nesse estágio. Várias decisões nele são de quem já se queimou antes: separar `person` dos papéis que ela exerce, modelar `employment_relationship` como entidade temporal em vez de `worker.company_id`, ledger append-only no financeiro, idempotência em webhook, teste automatizado de matriz de permissão, ADRs, "configuration over customization", e o marco do segundo sindicato como teste real de arquitetura. Nada disso é óbvio e quase nenhum projeto brasileiro nesse nicho começa assim.

O problema não está no que o documento diz. Está no que ele **não diz** — e o que falta é justamente o que decide se o projeto existe daqui a 18 meses.

Três lacunas são estruturais e precisam ser fechadas **antes do primeiro commit**:

1. **Não há uma linha sobre equipe, prazo ou orçamento.** Um roadmap de 15 fases sem capacidade declarada não é um plano, é uma lista de desejos.
2. **A tese de mercado não foi testada contra a realidade financeira do setor sindical brasileiro pós-2017.** Essa é a fragilidade mais séria do documento, e ele não a menciona nenhuma vez.
3. **Filiação sindical é dado pessoal sensível pela LGPD.** Isso não é um detalhe de compliance — é o eixo do produto inteiro e muda requisitos de segurança, IA, exportação e contrato.

O resto desta revisão detalha essas três e mais dez pontos, em ordem de gravidade.

---

## Bloco A — Riscos que podem matar o projeto

### A1. A tese de mercado ignora o colapso de receita do setor · CRÍTICO

A seção 2 afirma que a oportunidade é "criar uma infraestrutura tecnológica especializada para gestão sindical brasileira". O documento nunca pergunta se esse mercado **tem dinheiro**.

Os números: a arrecadação de contribuição sindical caiu de **R$ 3 bilhões em 2017 para R$ 65,6 milhões em 2021** — cerca de 97,8%. Para os sindicatos de trabalhadores especificamente, a queda foi de R$ 1,47 bilhão (2017) para R$ 10,9 milhões no 1º semestre de 2022, ~99,3%. A reforma trabalhista de novembro de 2017 transformou um tributo obrigatório desde 1940 em contribuição voluntária.

Isso não invalida a tese — pode até reforçá-la, porque entidade sem dinheiro precisa desesperadamente de eficiência operacional e de recuperar receita (mensalidade associativa, contribuição assistencial, serviços). Mas muda tudo no desenho comercial:

- O ticket viável é **muito menor** do que um SaaS B2B equivalente em outro setor.
- O argumento de venda não pode ser "organize sua operação". Tem que ser **"este sistema aumenta sua arrecadação em X%"** — ROI direto e mensurável.
- Um produto com 12 módulos e IA tem custo de desenvolvimento de mercado enterprise e um mercado com capacidade de pagamento de SMB. Essa tesoura é o risco número um do negócio.

**O que fazer:** antes da Fase 2, ter 5 a 10 conversas com sindicatos que **não sejam o SECABC**. Não perguntar sobre funcionalidades (todo mundo diz que quer tudo). Perguntar: quanto você paga hoje em sistemas? quem assina o cheque? qual o teto mensal? o que faria você trocar de fornecedor? E mapear os concorrentes reais que já vendem para esse público — o documento não cita um único.

### A2. Risco político: o comprador tem mandato · CRÍTICO

Diretoria de sindicato é eleita, com mandato tipicamente de 3 a 4 anos. Isso significa:

- Ciclo de venda longo e político, não técnico.
- Troca de diretoria pode cancelar contrato herdado da gestão anterior — inclusive por motivo político, não por insatisfação com o produto.
- O sistema concentra dados de arrecadação e de filiação: uma nova gestão pode ver o fornecedor da gestão anterior como adversário.
- Churn não é função de qualidade do produto. É função de eleição.

O documento trata o SECABC como "design partner" e "referência comercial", mas não tem nenhuma linha sobre governança do relacionamento, contrato plurianual, ou o que acontece na troca de gestão.

### A3. Não existe modelo de negócio com o SECABC · CRÍTICO

O documento chama o SECABC de "cliente fundador" e "design partner" — dois papéis muito diferentes — sem definir nenhum dos dois. Perguntas sem resposta:

- O SECABC **paga** o desenvolvimento, ou recebe a plataforma em troca de servir de laboratório?
- Quem é dono do código? Se o SECABC financia, ele pode reivindicar propriedade intelectual — e aí não existe SaaS para vender.
- Há exclusividade? O SECABC vai aceitar que o sistema construído com o processo dele seja vendido para o sindicato vizinho?
- Existe cláusula de saída? O que acontece com os dados se a relação terminar?

Isso determina o comportamento do projeto inteiro. Se o SECABC paga, ele vai exigir customização — e a seção 115 ("necessidade sindical ou particularidade do SECABC?") vira uma discussão política a cada sprint, não técnica. Se não paga, a Veramo queima capital próprio por 12+ meses sem receita e precisa saber quanto tem de pista.

**Isso precisa ser um contrato assinado, não uma seção de documento.**

### A4. Escopo × capacidade não declarada · CRÍTICO

119 seções, 15 fases, 12 disciplinas, ~30 entidades no core, 3 experiências de usuário (backoffice + 2 portais) e um control plane. Com zero linhas de código hoje.

Ordem de grandeza honesta, para um time sênior competente:

| Escopo | Time de 2 devs | Time de 5 devs |
|---|---|---|
| Fase 0 (Discovery) | 6–10 semanas | 4–6 semanas |
| Fases 1–3 (Foundation + Core + Atendimento) | 9–14 meses | 5–7 meses |
| Fases 1–5 (+ Agenda + Financeiro) | 18–30 meses | 10–16 meses |
| Fases 1–15 completas | não acontece | 3–5 anos |

Não é um julgamento sobre a ambição — é aritmética. E há um efeito composto: cada fase adicional aumenta a superfície de manutenção das anteriores, então a velocidade cai ao longo do tempo, não sobe.

O documento precisa declarar equipe, custo mensal de queima e quantos meses de pista existem. Sem isso, a priorização entre fases não tem critério — e priorização sem critério vira "fazer tudo um pouco".

---

## Bloco B — Erros de sequenciamento e escopo

### B1. Financeiro na Fase 5 é tarde demais · ALTO

Arrecadação é a razão de existir de um sindicato e, dado o A1, é a dor número um. Colocá-la depois de Foundation + Core + Atendimento + Agenda significa que **por 12 a 20 meses o sistema não toca no que mais importa para quem paga a conta**.

O argumento do documento (seção 60: "somente após o Core estar sólido") é tecnicamente correto — financeiro sobre cadastro ruim é desastre. Mas a conclusão prática está errada. O caminho melhor é uma **fatia fina de financeiro entrando junto com o Core**, não um módulo financeiro completo depois dele:

> cadastrar associado → registrar mensalidade → gerar cobrança PIX → conciliar → baixar → recibo

Esse fluxo único, ponta a ponta, com ledger e idempotência corretos desde o início, entrega valor visível cedo e força o Core a ser sólido no que realmente precisa ser. O módulo financeiro completo (arrecadação empresarial, guias, régua de inadimplência, renegociação, split) continua depois.

**Recomendação:** inverter a ordem de Agenda (Fase 4) e Financeiro (Fase 5), e antecipar a fatia fina de cobrança para a Fase 2.

### B2. A Fase 1 contradiz a seção 68 · ALTO

A seção 68 prega vertical slice: "não desenvolver todo frontend e depois backend". A seção 56 lista 18 itens de Foundation — CI/CD, observability, RBAC, RLS, audit, feature flags, design system, event bus, queue, storage — **antes de qualquer módulo de negócio**. São meses de trabalho sem uma única tela que um funcionário do SECABC consiga usar.

Isso é o clássico "big foundation up front", e ele falha por dois motivos: você constrói abstrações para requisitos que ainda não conhece, e o cliente perde a confiança porque não vê nada.

**Recomendação:** a Fase 1 deve ser *um* vertical slice fino que já entrega algo real (ex.: "buscar um trabalhador e ver a ficha dele"), carregando de foundation apenas o que aquele slice exige: auth, tenancy, uma permissão, uma tabela, um audit log, um teste. Cada slice seguinte engrossa a fundação. O documento tem a filosofia certa na seção 68 e a trai na 56.

### B3. Generalizar a partir de N=1 · ALTO

O documento resolve por decreto a tensão central do projeto: "nenhuma decisão estrutural importante deverá depender exclusivamente do funcionamento atual do SECABC" (seção 2), e a seção 115 dá o critério de triagem. Mas critério não substitui evidência: **com um único cliente você não tem como saber o que é necessidade sindical e o que é particularidade do SECABC.** Vai errar nas duas direções.

O resultado previsível é over-engineering: workflow engine genérico, template engine, audience builder, regras configuráveis, split de pagamento — tudo construído para uma flexibilidade que ninguém ainda pediu, custando 3 a 5× o tempo da versão direta.

**Regra prática melhor que o decreto:** hardcode com fronteira limpa até aparecer a **segunda** evidência real de variação. Um `if` isolado atrás de uma interface bem nomeada é mais barato de generalizar depois do que uma engine genérica é de simplificar. A "rule of three" existe por isso.

Isso vale especialmente para: workflow engine (seção 30), split de pagamento (seção 18), audience builder (seção 27) e white label (seção 106). Nenhum desses precisa existir antes do segundo sindicato.

### B4. Colônia, jurídico e portais são produtos separados disfarçados de fases · MÉDIO

- **Colônia de férias (seção 21)** é um PMS hoteleiro. Tarifa por temporada, disponibilidade, overbooking, check-in/out, lista de espera. O documento reconhece que "não é simplesmente uma agenda" — e está certo, o que significa que é um segundo domínio grande, não reuso da engine de agendamento.
- **Jurídico (seção 23)** foi bem contido como "Legal Service Management" em vez de software jurídico completo. Boa decisão.
- **Portais do trabalhador e da empresa (fases 10–11)** duplicam a superfície de segurança: autenticação externa, autorização de dado sensível para o próprio titular, rate limiting, fraude de acesso. São o dobro do trabalho que parecem.

Nenhum precisa estar num roadmap comprometido agora. Devem ser add-ons vendidos separadamente (como a seção 109 já sugere) e construídos sob demanda paga.

---

## Bloco C — Lacunas técnicas e regulatórias

### C1. Todo o produto opera sobre dado pessoal sensível · CRÍTICO

A LGPD, art. 5º, II, define dado pessoal sensível incluindo literalmente **"filiação a sindicato"**. O documento trata LGPD bem no aspecto técnico (seções 38, 97, 98) mas não registra em nenhum lugar a consequência mais importante: **a entidade central do produto — `membership` — é dado sensível por definição legal.** E boa parte do resto também: dado de saúde (agenda odontológica, médica, psicológica), dado de processo judicial trabalhista.

O que isso muda concretamente:

- **Base legal.** Dado sensível não aceita "legítimo interesse" (art. 11). Só consentimento específico e destacado, ou hipóteses restritas: obrigação legal/regulatória, exercício regular de direitos em processo, tutela da saúde por profissional, proteção da vida, prevenção à fraude. Cada tratamento do sistema precisa ser mapeado para uma dessas — não dá para resolver com uma política de privacidade genérica.
- **Papéis.** O sindicato é **controlador**; a Veramo é **operadora**. Isso exige contrato de tratamento de dados (DPA) por tenant, com escopo, subprocessadores declarados (Vercel, Supabase, Railway, provedor de LLM), e obrigações de segurança e incidente. Não é opcional e não está no documento.
- **IA.** Enviar dado de filiação sindical e de saúde para um LLM de terceiro exige decisão explícita: qual provedor, DPA assinado, se os dados saem do Brasil, opt-out de treinamento, retenção. Idem para embeddings no pgvector — embedding de dado sensível continua sendo dado sensível.
- **Marketing.** Campanhas segmentadas por filiação (seção 27) são segmentação por dado sensível. Precisa de base legal própria.
- **Residência de dados.** Vercel `gru1` resolve a função; o banco Supabase e o storage precisam estar na região de São Paulo também, e isso deve estar escrito.

**Recomendação: ADR-000 — "O produto opera sobre dado pessoal sensível"**, escrita antes de qualquer outra, com o mapa de base legal por tratamento. Isso vira também argumento comercial: um concorrente que não fez esse trabalho está exposto.

### C2. Faltam as integrações que definem o domínio · ALTO

O documento cita integrações genericamente — "bancos, gateways, WhatsApp, e-mail, APIs públicas". Mas o domínio sindical brasileiro tem um conjunto específico e obrigatório que não aparece em lugar nenhum:

- **Retorno bancário CNAB 240/400** e registro de boleto. É a integração mais chata e mais crítica do financeiro, varia por banco, e sozinha costuma consumir semanas. Gateway de pagamento genérico não substitui.
- **PIX via API do banco específico** (cada banco tem a sua) ou PSP — com conciliação por txid/e2eid.
- **Consulta e enriquecimento de CNPJ** (Receita Federal / serviços derivados) — a seção 14 pede "busca CNPJ" e "enriquecimento" sem dizer de onde.
- **eSocial / FGTS Digital / Novo CAGED** — fonte de verdade sobre vínculo empregatício, que é exatamente a entidade da seção 10.
- **Sistema Mediador (MTE)** — registro de CCT/ACT. A seção 15 lista "Convenções" na ficha da empresa; convenção vem de algum lugar.
- **Assinatura eletrônica** (gov.br / ICP-Brasil) — a seção 22 põe "Assinatura" no fluxo de homologação sem definir provedor nem valor jurídico.
- **Certidões e regularidade** para o módulo de arrecadação empresarial.

Cada uma dessas é escopo real não estimado. Juntas, podem ser o maior bloco de esforço do projeto e mudam substancialmente a estimativa das Fases 5 e 7.

### C3. WhatsApp como canal de cobrança: risco subestimado · ALTO

O documento trata WhatsApp como um canal a mais no Communication Hub (seção 25) e menciona "WhatsApp bloqueado" só como runbook (seção 96). A realidade da WhatsApp Business Platform:

- Custo **por conversa**, não por mensagem — campanhas em massa têm custo variável relevante no P&L do produto.
- Janela de 24h: fora dela, só template pré-aprovado pela Meta.
- Templates de cobrança passam por aprovação e podem ser negados.
- Limites de disparo escalonados por qualidade do número; qualidade cai com bloqueios de usuário.
- Cobrança em massa não solicitada é a forma mais rápida conhecida de derrubar a qualidade do número e perder o canal.
- Sobrepõe-se ao C1: disparo baseado em filiação exige base legal.

Se a régua de inadimplência (seção 16) presume WhatsApp como canal principal, essa premissa precisa ser validada antes de virar fase de roadmap.

### C4. RLS como mecanismo primário de autorização · ALTO

O documento combina RBAC + ABAC + escopos (`own`/`branch`/`department`/`tenant`/`global`) + sensibilidade de dado, e coloca isso "também na camada de dados" via RLS do Supabase (seção 4.5, 37).

Tecnicamente possível, mas há um custo que o documento não reconhece: policies RLS que precisam resolver escopo hierárquico fazem joins ou subqueries a cada linha avaliada. Com dezenas de milhares de trabalhadores e centenas de milhares de cobranças, isso degrada de forma difícil de diagnosticar — o plano de query muda por causa da policy e não aparece no código da aplicação. Depurar RLS lenta é notoriamente ruim.

Além disso, matriz de permissão expressa em SQL é mais difícil de testar e versionar do que a mesma matriz em TypeScript.

**Recomendação:** decidir explicitamente em ADR entre dois modelos, com benchmark antes:

- **(a) App-layer primária + RLS defensiva** — a autorização rica (roles, escopos, sensibilidade) vive na API, tipada e testável; RLS carrega apenas o isolamento de tenant, que é simples, barato e é a garantia que realmente importa. É o que eu recomendaria.
- **(b) RLS primária** — mais forte no papel, mas exige claims bem desenhadas, policies simples e benchmark contínuo.

O que não pode acontecer é a regra viver nos dois lugares divergindo — é assim que surge a falha de autorização que a seção 73 tenta prevenir.

### C5. Três provedores para um time pequeno · MÉDIO

Vercel + Supabase + Railway = três contas, três faturas, três consoles, três status pages, três modelos de secret, e latência de rede entre eles em todo caminho que atravesse a fronteira. Para uma equipe grande é um trade-off razoável; para um time de 2–5 pessoas é sobrecarga operacional real.

A justificativa precisa ser mais forte que "cada um é bom no seu". Vale avaliar consolidar a camada de workers/filas junto do resto, ou ao menos garantir que os três estejam na mesma região (São Paulo) — o documento cuida disso para a Vercel (`gru1`) mas não diz nada sobre a região do Supabase nem do Railway, e um banco fora do Brasil quebra tanto latência quanto o argumento de residência de dados do C1.

### C6. Gestão de mudança está ausente · MÉDIO

A seção 4.4 identifica corretamente a dor: informação que só existe na cabeça de alguns funcionários. O documento não reconhece a consequência: **esse conhecimento é poder, e tornar o processo institucional retira poder de pessoas específicas.** Elas vão resistir — passivamente, em geral: agenda cheia na hora do shadowing, "isso o sistema não faz", planilha paralela que continua rodando.

O plano prevê entrevistas (49), shadowing (50) e "training" no checklist de go-live (92). Falta:

- Patrocinador nomeado dentro do SECABC com autoridade para liberar tempo dos funcionários.
- Quem, nominalmente, participa do discovery e quantas horas.
- O que acontece quando um setor se recusa a migrar.
- Como se detecta e se encerra o sistema paralelo (planilha, WhatsApp) depois do go-live.

Discovery consome tempo de gente que tem trabalho para fazer. Sem autorização formal, ele simplesmente não acontece.

---

## Bloco D — Contradições internas e pontas soltas

| # | Onde | Observação |
|---|---|---|
| D1 | Seção 56 × 68 | Foundation grande primeiro contradiz vertical slice. Ver B2. |
| D2 | Seção 109 × 111 | A 111 diz para não definir SLA antes de medir capacidade real; a 109 já propõe três planos comerciais. Planos implicam compromissos. Definir depois. |
| D3 | Seção 40 × 67 | pgvector já na fundação, mas IA só na Fase 12. Ou a IA entra antes, ou o pgvector espera. Manter na fundação sem uso é convite a antecipar a IA por curiosidade. |
| D4 | Seção 19 × 21 | Agenda e Colônia são apresentadas quase como reuso, mas o próprio texto reconhece que a colônia é um domínio de reservas distinto. Não contar com reaproveitamento na estimativa. |
| D5 | Seção 17 | Ledger "não substitui a contabilidade oficial" e "deverá permitir integração com sistemas contábeis" — mas nenhum sistema contábil é nomeado e a integração não aparece em nenhuma fase. |
| D6 | Seção 11 | Status de `membership` inclui `falecido`. Óbito é atributo da pessoa, não da associação. Modelar em `person`, com efeito derivado sobre a associação. |
| D7 | Seção 8 | `PERSON` lista "usuário" como papel. Vale separar identidade de autenticação (`user`) de pessoa de negócio (`person`) — nem todo usuário é pessoa cadastrada, e amarrar os dois cedo costuma doer depois. |
| D8 | Seção 54 | O core lista `charge`, `payment`, `transaction` mas não lista `ledger_entry`, que a seção 17 exige. Pequeno, mas o core é a lista que vira schema. |
| D9 | Geral | Nenhuma menção a **dependentes com dados de saúde** — a colônia e o odontológico atendem dependentes, frequentemente menores. Dado de menor + dado sensível = requisito adicional. |
| D10 | Nomenclatura | O projeto está registrado aqui como **"Syntex"** e o documento inteiro fala em **"Veramo"**. Se são a mesma coisa, alinhar o nome antes que apareça em contrato, domínio e código. |

---

## O que está bem feito (e deve ser protegido de si mesmo)

Vale registrar, porque na hora do aperto essas são as primeiras coisas que se corta — e são exatamente as que não se deve:

- **`person` separada de papéis** (seção 8) e **`employment_relationship` temporal** (seção 10). Duas decisões que resolvem 80% das dores de modelagem que projetos assim descobrem no mês 14.
- **Ledger append-only + idempotência** (17, 83). Sem isso, financeiro não é auditável e webhook duplicado vira prejuízo.
- **Testes de matriz de permissão** (73). Corretíssimo classificar essa falha como mais grave que falha visual.
- **AI safety layer herdando permissões do usuário** (33). Muita gente vai errar isso nos próximos anos; o documento já acertou.
- **`worker.read` ≠ `worker.export`** (99). Distinção sutil e certa.
- **Marco do segundo sindicato** (114). O melhor teste de arquitetura do documento inteiro.
- **Regra de fundação** (119): processo → domínio → dado → regra → permissão → evento → API → UX → teste. É a tese correta do projeto.
- **Backup sem restore testado não conta** (79). Frase que só escreve quem já perdeu dado.

---

## Recomendações, em ordem de execução

**Antes de qualquer código:**

1. **Documento de 3 páginas** — equipe, custo mensal, meses de pista, prazo-alvo por fase. Sem isso não há priorização possível.
2. **Contrato com o SECABC** — natureza da relação (paga ou parceria), propriedade intelectual, exclusividade, uso do processo dele em produto comercial, saída e dados. Assinado, não combinado.
3. **ADR-000 — dado sensível e LGPD** — base legal por tratamento, papéis controlador/operador, subprocessadores, residência de dados, política de IA sobre dado sensível.
4. **Validação de mercado** — 5 a 10 conversas com sindicatos que não o SECABC, sobre preço e decisor, não sobre funcionalidade. Mapear os concorrentes que já vendem para esse público.

**Ao entrar em execução:**

5. **Cortar o roadmap de 15 fases para 4 com data.** Sugestão: (0) Discovery · (1) Core cadastral + fatia fina de cobrança · (2) Atendimento 360º · (3) Financeiro completo. Tudo além disso é backlog não comprometido, não roadmap.
6. **Reordenar Agenda e Financeiro**, e antecipar o fluxo cadastrar → cobrar → conciliar → baixar → recibo (B1).
7. **Reescrever a Fase 1** como vertical slice fino, não como fundação monolítica (B2).
8. **ADR sobre autorização** — app-layer primária + RLS de tenant, ou RLS primária. Com benchmark, não por preferência (C4).
9. **Levantar as integrações regulatórias** (eSocial, Mediador, CNAB, PIX, gov.br, CNPJ) e estimar. Provavelmente é o maior bloco escondido do projeto (C2).
10. **Nomear o patrocinador no SECABC** e formalizar as horas de discovery antes de agendar a primeira entrevista (C6).

**Adiar deliberadamente até haver evidência:** workflow engine genérico, split de pagamento, audience builder, white label, portais externos, control plane, camada de IA. Todos são corretos como visão e prematuros como construção.

---

## Fontes

- [LGPD — Lei nº 13.709/2018, art. 5º, II e art. 11 (Planalto)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Contribuição sindical despenca depois da reforma trabalhista (Poder360)](https://www.poder360.com.br/economia/contribuicao-sindical-despenca-depois-de-reforma-trabalhista/)
- [Contribuição Sindical — Senado Notícias](https://www12.senado.leg.br/noticias/entenda-o-assunto/contribuicao-sindical)
