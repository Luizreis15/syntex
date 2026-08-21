# Checklist — Cadastro de empresa (painel sindicato)

Referência operacional (Veramo / SECABC) para o formulário **Nova empresa**.
Ciclo atual: só shell do tenant; portais `/empresa` `/associado` `/escritorio` não evoluem.

## Blocos obrigatórios na UI

### 1. Identificação
- [x] CNPJ
- [x] Razão social
- [x] Nome fantasia
- [x] CNAE principal (select da tabela `cnae`)
- [x] Unidade sindical responsável (`branch`)

### 2. Contato e endereço
- [x] Telefone (`company.phone` — migration 0025)
- [x] CEP, logradouro, bairro, cidade, UF (`address_*` já em 0016)

### 3. Responsável pela conta (portal empresa)
- [x] Nome do responsável
- [x] E-mail (convite `company_master`) — rótulo PT-BR, nunca “company master”
- [ ] Senha direta (opcional futuro; hoje: token de convite)

### 4. Estabelecimento
- [x] Matriz criada com mesmo CNPJ da empresa (kind `matriz`) no create

## Fora deste ciclo
- Filiais adicionais na mesma tela
- Carta de oposição / Atendimento pleno
- Portais espelho
