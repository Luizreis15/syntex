# Entrega palpável SECABC — reunião 17/09/2026

**Âncora:** ciclo Core (empresa → pendente → **ativa** → cobrança + origem)  
**Fora:** Atendimento, Engajamento, IA, Homologações/Veramo, tenant virgem completo  

## Capacidade

| Quando | Horas |
|--------|-------|
| **Hoje 30/08** | **5 h** (esta sessão) |
| **31/08 → 16/09** | **2–3 h/dia** (~34–51 h) |
| **17/09** | Reunião / demo |

Calendário ≈ 18 dias; orçamento útil ≈ **40–55 h** no total.

## Definição de pronto na reunião

Um operador do SECABC, em ambiente acordado, em **&lt;20 min**:

1. Abre/cadastra empresa + estabelecimento  
2. Inclui na base (**pendente**) → **Ativa**  
3. Gera cobrança e mostra **por que existe**  

Sidebar só Core (ADR-022). Painel DEMO ignorado / rotulado.

## Ritmo diário (2–3 h)

```
0:10  o que quebrou ontem / 1 objetivo do dia
1:30  uma fatia vertical (código + teste)
0:20  você clica o caminho feliz
0:10  anotar bloqueio → amanhã
```

**Proibido no dia a dia:** módulo novo fora do ciclo · redesign · “já que estamos aqui”.

## Hoje (5 h) — ordem

| Bloco | Tempo | Entrega |
|-------|-------|---------|
| A | 0:30 | Este plano + alinhamento |
| B | 2:00 | Atalhos UX: status **Ativa/Pendente** na 360; resolver débitos com empresa pré-selecionada; copy ADR-021 |
| C | 1:00 | Roteiro demo 1 página (abaixo) |
| D | 1:00 | Você clica o ciclo; eu corrijo o 1º bloqueio |
| E | 0:30 | Commit + lista do que falta até 17/09 |

## Semanas até 17/09 (macro)

| Janela | Foco |
|--------|------|
| 30/08–03/09 | Ciclo não quebra + UX do caminho feliz |
| 04/09–10/09 | Seed estável + ensaio interno + bugs bloqueantes |
| 11/09–16/09 | Freeze demo + checklist sala + 1 backup |
| **17/09** | Reunião |

## Roteiro demo (sala) — 12 min

**Login:** `diretoria@secabc.exemplo.org.br`  

1. **Empresas** → abrir uma (ou Nova com município) — 2 min  
2. Aba **Representação** → estabelecimento → **Incluir na base** (Pendente) → **Ativar** — 3 min  
3. **Convenções** → Resolver aplicabilidade (data na vigência CCT) — 2 min  
4. **Cobranças** → O que deve / Resolver → gerar — 3 min  
5. Abrir cobrança → **Por que esta cobrança existe** — 2 min  

**Não mostrar:** Painel DEMO como verdade · Engajamento · “Em disputa” salvo se perguntarem (juízo).

**Frase de fechamento:**  
> O sistema é passivo: cadastro na base, ativa, sobe cobrança. Briga judicial não é workflow — o que manda no dia a dia é CNAE + decisão de quem cadastrou.

## Checklist pré-reunião (16/09)

- [ ] Re-seed DEV recente (C3: CCT 2026 + logins)  
- [ ] App staging/DEV acessível na sala  
- [ ] Login diretoria testado no dia  
- [ ] Empresa “demo reunião” escolhida (ativa + CCT ok)  
- [ ] Competência de cobrança anotada (ex. `2026-08`)  
- [ ] Plano B: screenshots do ciclo se rede falhar  

---

**Fim — calendário 17/09**
