import { describe, expect, it } from "vitest";
import { NAV_SECTIONS } from "@/components/layout/nav-config";

/**
 * ADR-022 — sidebar só Core operacional (sem built:false / mapa fantasma).
 */
const CORE_NAV: Record<string, string> = {
  Painel: "/painel",
  Trabalhadores: "/trabalhadores",
  Empresas: "/empresas",
  Representação: "/representacao",
  Convenções: "/convencoes",
  Cobranças: "/cobrancas",
  Equipe: "/equipe",
  Escritórios: "/escritorios",
};

const REMOVED_FROM_NAV = [
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

describe("ADR-022 — sidebar Core operacional", () => {
  it("contém exatamente os 8 itens Core com href", () => {
    const items = allItems();
    expect(items).toHaveLength(Object.keys(CORE_NAV).length);
    for (const [label, href] of Object.entries(CORE_NAV)) {
      const item = items.find((i) => i.label === label);
      expect(item, label).toBeDefined();
      expect(item!.built).toBe(true);
      if (!item || !item.built) throw new Error(label);
      expect(item.href).toBe(href);
    }
  });

  it("não reintroduz mapa fantasma / Engajamento / Inteligência", () => {
    const labels = allItems().map((i) => i.label);
    for (const label of REMOVED_FROM_NAV) {
      expect(labels, label).not.toContain(label);
    }
    expect(NAV_SECTIONS.map((s) => s.label)).toEqual([
      "Visão geral",
      "Relações",
      "Financeiro",
      "Administração",
    ]);
  });

  it("todos os itens são built:true", () => {
    expect(allItems().every((i) => i.built)).toBe(true);
  });
});
