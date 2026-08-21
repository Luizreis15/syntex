import { describe, expect, it } from "vitest";
import { formatCnpj, isValidCnpj } from "@/lib/formatters/cnpj";
import { formatCpf, isValidCpf } from "@/lib/formatters/cpf";
import { formatMoeda } from "@/lib/formatters/moeda";
import { formatData, formatDataHora } from "@/lib/formatters/data";
import { formatCompetencia } from "@/lib/formatters/competencia";
import { formatTelefone } from "@/lib/formatters/telefone";
import { formatPercentual } from "@/lib/formatters/percentual";

describe("lib/formatters", () => {
  it("formatCnpj / isValidCnpj", () => {
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(isValidCnpj("11222333000181")).toBe(true);
    expect(isValidCnpj("11222333000199")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
  });

  it("formatCpf / isValidCpf", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(isValidCpf("52998224725")).toBe(true);
    expect(isValidCpf("52998224700")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
  });

  it("formatMoeda", () => {
    expect(formatMoeda(1234.5)).toBe("R$ 1.234,50");
    expect(formatMoeda(0)).toBe("R$ 0,00");
  });

  it("formatData / formatDataHora", () => {
    expect(formatData("2026-08-19")).toBe("19/08/2026");
    expect(formatDataHora("2026-08-19T14:32:00Z")).toMatch(/19\/08\/2026 \d{2}:\d{2}/);
  });

  it("formatCompetencia", () => {
    expect(formatCompetencia("2026-08")).toBe("08/2026");
    expect(formatCompetencia("2026-08-01")).toBe("08/2026");
  });

  it("formatTelefone", () => {
    expect(formatTelefone("11987654321")).toBe("(11) 98765-4321");
    expect(formatTelefone("1123456789")).toBe("(11) 2345-6789");
    expect(formatTelefone("987654321")).toBe("98765-4321");
  });

  it("formatPercentual", () => {
    expect(formatPercentual(1.5)).toBe("1,50%");
    expect(formatPercentual(0)).toBe("0,00%");
  });
});
