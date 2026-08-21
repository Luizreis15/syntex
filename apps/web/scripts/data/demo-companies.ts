/**
 * Dados de demonstração — lista legível e editável à mão, não gerada por
 * combinação em laço (prompt 02.1 §1). Todo nome é fictício; nenhum é razão
 * social de empresa real. Bairros e referências locais (Utinga, Capuava,
 * Vila Guiomar, Tamanduateí, Paranapiacaba...) são reais do ABC paulista —
 * é o que dá plausibilidade sem copiar uma empresa que existe.
 *
 * `cnae` referencia o código em COMMERCE_CNAES (seed.ts). `branch` é uma
 * das cinco unidades. `scenario` decide o histórico de representação
 * (ver seedRepresentationForScenario em seed.ts). `filial` é opcional —
 * uma segunda unidade da empresa em outro município, para demonstrar que
 * a resolução acontece por estabelecimento, não por empresa.
 */

export type Branch = "Santo André" | "Mauá" | "São Caetano do Sul" | "São Bernardo do Campo" | "Diadema";

export type Scenario =
  | "stable" // reconhecida há muito tempo, nunca mudou
  | "evolved" // reconhecida, mas com 2-3 períodos por reenquadramento — mudou, nunca por disputa
  | "claimed" // reivindicada recente, ainda não reconhecida
  | "disputed" // duas reivindicações concorrentes, disputa em aberto
  | "lost" // perdeu a representação
  | "resolved"; // foi disputada no passado e voltou a ser reconhecida depois

export interface DemoCompany {
  legalName: string;
  tradeName?: string;
  branch: Branch;
  cnae: string;
  scenario: Scenario;
  filial?: { branch: Branch; cnae?: string };
}

export const DEMO_COMPANIES: DemoCompany[] = [
  // ---- Santo André (concentração maior, como no mundo real) ----
  { legalName: "Irmãos Bertoldi Comércio de Alimentos Ltda", tradeName: "Mercado Bertoldi", branch: "Santo André", cnae: "47.11-3-02", scenario: "stable" },
  { legalName: "Drogaria Vila Guiomar Ltda", branch: "Santo André", cnae: "47.71-7-01", scenario: "stable" },
  { legalName: "Papelaria Central do ABC Ltda", branch: "Santo André", cnae: "47.61-0-03", scenario: "stable" },
  { legalName: "Farmácia Popular do Utinga ME", branch: "Santo André", cnae: "47.71-7-01", scenario: "evolved" },
  { legalName: "Eletrodomésticos Rio Grande Ltda", branch: "Santo André", cnae: "47.53-9-00", scenario: "stable" },
  { legalName: "Casa das Tintas Colorama Ltda", branch: "Santo André", cnae: "47.44-0-05", scenario: "stable",
    filial: { branch: "São Bernardo do Campo" } },
  { legalName: "Mercearia São Judas Tadeu Ltda", branch: "Santo André", cnae: "47.11-3-02", scenario: "claimed" },
  { legalName: "Ferragens Capuava Ltda", branch: "Santo André", cnae: "47.44-0-05", scenario: "stable" },
  { legalName: "Informática Byte Fácil Ltda", branch: "Santo André", cnae: "47.51-2-01", scenario: "evolved" },
  { legalName: "Panificadora Vila Assunção ME", branch: "Santo André", cnae: "47.21-1-02", scenario: "stable" },
  { legalName: "Auto Peças Rodovale EIRELI", branch: "Santo André", cnae: "45.30-7-03", scenario: "disputed" },
  { legalName: "Confecções Vale do Tamanduateí Ltda", branch: "Santo André", cnae: "47.81-4-00", scenario: "resolved" },
  { legalName: "Ótica Bandeirante Ltda", branch: "Santo André", cnae: "47.74-1-00", scenario: "stable" },
  { legalName: "Magazine Príncipe do ABC S.A.", branch: "Santo André", cnae: "47.13-0-02", scenario: "stable",
    filial: { branch: "Mauá" } },
  { legalName: "Açougue Bom Corte Vila Pires Ltda", branch: "Santo André", cnae: "47.22-9-02", scenario: "lost" },
  { legalName: "Perfumaria Essência Real ME", branch: "Santo André", cnae: "47.72-5-00", scenario: "stable" },
  { legalName: "Saneantes Higibras Ltda", branch: "Santo André", cnae: "47.89-0-05", scenario: "evolved" },

  // ---- São Bernardo do Campo ----
  { legalName: "Supermercado Irmãos Farah Ltda", branch: "São Bernardo do Campo", cnae: "47.11-3-02", scenario: "stable" },
  { legalName: "Bertolucci Autopeças EIRELI", branch: "São Bernardo do Campo", cnae: "45.30-7-03", scenario: "stable" },
  { legalName: "Casa do Parafuso Utilidades Ltda", branch: "São Bernardo do Campo", cnae: "47.44-0-05", scenario: "claimed" },
  { legalName: "Loja de Departamentos Aurora S.A.", branch: "São Bernardo do Campo", cnae: "47.13-0-02", scenario: "stable",
    filial: { branch: "Diadema" } },
  { legalName: "Açougue e Frios Vale Verde ME", branch: "São Bernardo do Campo", cnae: "47.22-9-02", scenario: "stable" },
  { legalName: "Drogaria Alvorada Rudge Ramos Ltda", branch: "São Bernardo do Campo", cnae: "47.71-7-01", scenario: "disputed" },
  { legalName: "Confecções Bela Norte ME", branch: "São Bernardo do Campo", cnae: "47.81-4-00", scenario: "stable" },
  { legalName: "Material de Construção Demarchi Ltda", branch: "São Bernardo do Campo", cnae: "47.44-0-05", scenario: "evolved",
    filial: { branch: "Santo André" } },
  { legalName: "Ótica Visão Clara do ABC ME", branch: "São Bernardo do Campo", cnae: "47.74-1-00", scenario: "lost" },

  // ---- Diadema ----
  { legalName: "Mercado Bom Preço de Diadema Ltda", tradeName: "Mercado Bom Preço", branch: "Diadema", cnae: "47.11-3-02", scenario: "evolved" },
  { legalName: "Confecções Duas Pontes S.A.", branch: "Diadema", cnae: "47.81-4-00", scenario: "stable" },
  { legalName: "Material de Construção Rocha Forte Ltda", branch: "Diadema", cnae: "47.44-0-05", scenario: "stable" },
  { legalName: "Açougue Bom Corte Piraporinha Ltda", branch: "Diadema", cnae: "47.22-9-02", scenario: "stable" },
  { legalName: "Papelaria Escolar Diadema Ltda", branch: "Diadema", cnae: "47.61-0-03", scenario: "claimed" },
  { legalName: "Farmácia Nova Diadema ME", branch: "Diadema", cnae: "47.71-7-01", scenario: "evolved" },
  { legalName: "Supermercado Piraporinha Ltda", branch: "Diadema", cnae: "47.11-3-02", scenario: "stable",
    filial: { branch: "São Caetano do Sul" } },
  { legalName: "Auto Peças Silvestre Ltda", branch: "Diadema", cnae: "45.30-7-03", scenario: "resolved" },

  // ---- Mauá ----
  { legalName: "Panificadora Estrela do Oriente ME", branch: "Mauá", cnae: "47.21-1-02", scenario: "stable" },
  { legalName: "Drogaria Nossa Senhora Aparecida ME", branch: "Mauá", cnae: "47.71-7-01", scenario: "stable" },
  { legalName: "Confecções Jardim Zaíra Ltda", branch: "Mauá", cnae: "47.81-4-00", scenario: "claimed" },
  { legalName: "Ferragens Matriz Mauá Ltda", branch: "Mauá", cnae: "47.44-0-05", scenario: "stable",
    filial: { branch: "Santo André" } },
  { legalName: "Ótica Capuava ME", branch: "Mauá", cnae: "47.74-1-00", scenario: "evolved" },
  { legalName: "Supermercado Vila Noemia Ltda", branch: "Mauá", cnae: "47.11-3-02", scenario: "disputed" },
  { legalName: "Papelaria e Bazar Ideal Ltda", branch: "Mauá", cnae: "47.61-0-03", scenario: "stable" },

  // ---- São Caetano do Sul ----
  { legalName: "Boutique Elegance Confecções ME", branch: "São Caetano do Sul", cnae: "47.81-4-00", scenario: "stable" },
  { legalName: "Perfumaria e Cosméticos Bella Vitta ME", branch: "São Caetano do Sul", cnae: "47.72-5-00", scenario: "stable" },
  { legalName: "Auto Peças Santa Paula Ltda", branch: "São Caetano do Sul", cnae: "45.30-7-03", scenario: "stable",
    filial: { branch: "Diadema" } },
  { legalName: "Magazine Fundação S.A.", branch: "São Caetano do Sul", cnae: "47.13-0-02", scenario: "evolved" },
  { legalName: "Farmácia Boa Saúde Osvaldo Cruz Ltda", branch: "São Caetano do Sul", cnae: "47.71-7-01", scenario: "claimed" },
  { legalName: "Açougue Nobre Santa Paula ME", branch: "São Caetano do Sul", cnae: "47.22-9-02", scenario: "stable" },
];
