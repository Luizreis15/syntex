import { describe, expect, it } from "vitest";
import { NAV_SECTIONS } from "@/components/layout/nav-config";

/**
 * C5 — contrato de honestidade da nav vs Core V1 (SYNTEX-VERSIONS + baseline).
 * `built:true` só para capability REAL do Core; fora do Core permanece `built:false`.
 */
const CORE_V1_BUILT_TRUE: Record<string, string> = {
  Painel: "/painel",
  Trabalhadores: "/trabalhadores",
  Empresas: "/empresas",
  Representação: "/representacao",
  Convenções: "/convencoes",
  Cobranças: "/cobrancas",
  Equipe: "/equipe",
  Escritórios: "/escritorios",
};

/** Fora do DoD V1 / V1.x BI — não devem ganhar href operacional nesta fase. */
const MUST_STAY_BUILT_FALSE = [
  "Atendimento",
  "Agenda",
  "Homologações",
  "Fiscalização",
  "Jurídico",
  "Arrecadação",
  "Financeiro",
  "Comunicação",
  "Campanhas",
  "Benefícios",
  "Analytics",
  "Syntex Intelligence",
  "Configurações",
] as const;

function allItems() {
  return NAV_SECTIONS.flatMap((s) => s.items);
}

describe("C5 — nav honesty Core V1", () => {
  it("itens Core V1 estão built:true com href esperado", () => {
    for (const [label, href] of Object.entries(CORE_V1_BUILT_TRUE)) {
      const item = allItems().find((i) => i.label === label);
      expect(item, label).toBeDefined();
      expect(item!.built, label).toBe(true);
      if (!item || !item.built) throw new Error(label);
      expect(item.href).toBe(href);
    }
  });

  it("itens fora do Core V1 permanecem built:false sem href", () => {
    for (const label of MUST_STAY_BUILT_FALSE) {
      const item = allItems().find((i) => i.label === label);
      expect(item, label).toBeDefined();
      expect(item!.built, label).toBe(false);
      if (item && item.built) {
        throw new Error(`${label} não pode ser built:true no Core V1`);
      }
    }
  });

  it("nenhum built:true aponta para rota fora do contrato Core listado", () => {
    const built = allItems().filter((i) => i.built);
    for (const item of built) {
      expect(CORE_V1_BUILT_TRUE[item.label], item.label).toBe(item.href);
    }
  });

  it("Arrecadação e Atendimento não competem com Cobranças / Representação", () => {
    const arrecadacao = allItems().find((i) => i.label === "Arrecadação");
    const atendimento = allItems().find((i) => i.label === "Atendimento");
    const cobrancas = allItems().find((i) => i.label === "Cobranças");
    expect(arrecadacao?.built).toBe(false);
    expect(atendimento?.built).toBe(false);
    expect(cobrancas?.built).toBe(true);
  });
});
