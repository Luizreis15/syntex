# Prompt 02.1 — Acabamento para a demonstração

> Prompt curto. É polimento, não domínio novo. Nada aqui muda schema.

Leia `design/SYNTEX-UI.md` antes. Sete itens, em ordem de importância. O item 1 sozinho vale mais que os outros seis somados.

---

## 1. Refazer o seed — este é o item crítico

O seed atual é combinatório e se denuncia: *Armarinhos Boa Vista, Armarinhos São Roque, Armarinhos Vitória, Bazar São Roque, Bazar Vitória, Casa São Roque, Casa Vitória*. É prefixo × sufixo. E os CNPJs são todos `20.000.0XX/0001-XX`, sequenciais.

Um diretor sindical do ABC olha isso e sabe em dois segundos que é dado inventado. A partir daí ele para de avaliar o produto e começa a descontar o que vê.

**O que o seed precisa ter:**

- **Nomes que não sigam um padrão único.** Nome de empresa real de comércio não é template. Vem de sobrenome de família, de referência local, de ramo, de sigla, de nome de fantasia sem relação com a razão social. Misture: `Irmãos Bertoldi Comércio de Alimentos Ltda`, `Supermercado Nova Petrópolis ME`, `Casa do Parafuso Utilidades Ltda`, `Drogaria Vila Guiomar Ltda`, `Bertolucci Autopeças EIRELI`, `Confecções Duas Pontes S.A.`, `Panificadora Estrela do Oriente ME`. Varie a forma jurídica: Ltda, ME, EIRELI, S.A.
- **Ramos variados dentro de comércio**, com o CNAE correspondente correto: supermercado, farmácia, autopeças, material de construção, confecção, padaria, loja de departamento, papelaria, açougue, ótica.
- **Raízes de CNPJ variadas** — não sequenciais. DV precisa fechar (mantenha a validação que já existe).
- **Distribuição realista pelas cinco unidades**, com Santo André concentrando mais, como é na vida real.
- **6 a 8 empresas com mais de um estabelecimento** (matriz + filiais), inclusive alguma com filial em município diferente da matriz — é o que demonstra que representação se resolve por estabelecimento, não por empresa.
- **Histórico de vigência com variedade real:** empresas que nunca mudaram, uma que perdeu representação, duas ou três disputadas, algumas reivindicadas recentes, uma que voltou a ser reconhecida depois de disputa resolvida.
- **Nomes plausíveis, jamais reais.** Não use razão social de empresa que exista de fato.

Deixe a lista de nomes num arquivo de dados legível e editável, não gerada por combinação em laço.

## 2. Usuário de demonstração com permissão ampla

Hoje a sidebar mostra uma linha só — "Relações → Empresas" — porque o usuário do seed só tem permissão de empresa. A navegação por permissão está *correta*, mas o efeito é que o produto parece ter uma funcionalidade.

Crie um usuário de demonstração com role de direção, com permissão sobre tudo que existe.

**E mostre a estrutura completa da plataforma na sidebar**, com os módulos ainda não construídos visivelmente indisponíveis — texto apagado, sem link, com marcação discreta do tipo `em breve`. Isso é honesto e comunica escopo. Um módulo clicável que abre tela vazia é pior que um módulo marcado como não disponível.

Seções: Visão geral · Relações (Trabalhadores, Empresas, Representação) · Operação (Atendimento, Agenda, Homologações, Fiscalização) · Financeiro (Arrecadação, Cobrança) · Inteligência.

A regra do `SYNTEX-UI.md` continua valendo para o que **existe**: módulo construído sem permissão do usuário não aparece. A marcação `em breve` é para o que ainda não foi construído para ninguém.

## 3. Substituir os `<select>` nativos

Os filtros de município e status usam `<select>` do sistema operacional, com a seta do macOS. Quebra o design system e é o detalhe que mais denuncia tela inacabada.

Crie `SyntexSelect` sobre o primitive Radix já disponível, tokenizado. Use nos dois filtros.

## 4. Corrigir a faixa de vigência reduzida

Na tabela ela está desenhada como uma barra cheia sem marcador — lê como barra de progresso, o que sugere "100% concluído". É o oposto do significado.

Adicione o **marcador da data de referência** na versão reduzida. Se não couber com clareza na largura da coluna, mostre os segmentos proporcionais com o marcador e nada mais — sem rótulo. O que não pode é parecer medidor de progresso.

## 5. Sidebar até o fim da viewport

Ela para em ~720px e deixa branco abaixo. Corrigir a altura do shell.

## 6. Tirar a redundância do topo

"Empresas" aparece três vezes: topbar, breadcrumb e `<h1>`. Mantenha breadcrumb e `<h1>`; tire o rótulo da topbar.

## 7. Completar os formatters e a toolbar

- `lib/formatters` tem só `cnpj.ts`. Adicione `cpf`, `moeda`, `data`, `competencia`, `telefone`, `percentual`, com teste.
- A tabela precisa de **contagem de resultados** e **visibilidade de coluna**, que estavam no prompt 02 e não vieram.

---

## Definition of Done

- Todos os testes existentes continuam passando, incluindo `token-conformance`
- Nenhum `<select>` nativo em nenhuma tela
- Screenshot novo de shell e lista para revisão
- Ao abrir a lista de empresas, a tabela mostra variedade de nome, de município, de ramo e de estado — sem padrão perceptível
- **`git push`** ao final. Há 12 commits que ainda não subiram para o GitHub.

## Onde parar e perguntar

Se a marcação `em breve` na sidebar conflitar com a regra de "módulo sem permissão não aparece", traga a proposta antes de implementar — a distinção entre *não construído* e *sem permissão* precisa ficar explícita no código, não implícita.

Comece confirmando o que entendeu.
