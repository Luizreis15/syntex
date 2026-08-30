# ADR-022 — Sidebar operacional Core (corte do mapa fantasma)

- Status: **aceita**
- Data: 2026-08-30
- Product Owner: aprovação explícita (“pode cortar como sugerido”)
- Emenda: ADR-017 (sete grupos + `built:false` como mapa completo na chrome)
- Relaciona: ADR-020 (freeze — alteração deliberada com aprovação PO),
  `docs/SYNTEX-VERSIONS.md`, `docs/OPERATIONAL-BASELINE.md`

## Contexto

ADR-017 colocou na sidebar o **mapa completo** do produto (Operação, Engajamento,
Inteligência, itens `built:false` inertes). Na fase Core isso deixou a chrome
**inchada**, com funções pouco claras e sem resultado operacional para o
sindicato (Comunicação, Campanhas, Benefícios, Homologações já cobertas por
Veramo, Analytics/Intelligence prematuros, etc.).

## Decisão

1. Na fase **Operational Core / Syntex Core V1**, a sidebar do painel do
   sindicato mostra **somente** itens com módulo REAL e DoD V1:

   - Visão geral → Painel  
   - Relações → Trabalhadores, Empresas, Representação, Convenções  
   - Financeiro → Cobranças  
   - Administração → Equipe, Escritórios  

2. **Removidos da nav** (não `built:false`): Atendimento, Agenda, Homologações,
   Fiscalização, Jurídico, Arrecadação, Financeiro (além de Cobranças),
   Engajamento inteiro, Inteligência inteira, Configurações.

3. Módulos futuros (V2+) entram na nav **só quando `built: true`** com rota e
   permission — sem reintroduzir mapa fantasma no Core.

4. Homologações / dashboard de pedidos-documentos (integração Veramo) = fatia
   futura explícita, **não** item de menu agora.

5. ADR-017 permanece válido como histórico da decisão de mapa; **esta ADR
   prevalece** sobre a chrome do Core enquanto a fase operacional Core estiver
   ativa.

## Consequências

- `nav-config.ts` e testes C5 refletem só o contrato Core.
- Baseline / VERSIONS: fora do Core não aparece como menu inerte.
- Reintroduzir seção Engajamento/Inteligência exige DoD de versão + PO.
