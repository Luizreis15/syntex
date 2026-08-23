import { describe, expect, it } from "vitest";
import { formatCpfMasked } from "@/lib/formatters/cpf";
import {
  buildTrabalhadorSummary,
  initialsFromName,
  membershipYearsLabel,
  formatEmploymentPeriod,
} from "@/features/workers/trabalhador-360-compose";

describe("trabalhador 360 compose", () => {
  it("initialsFromName usa primeiro e último", () => {
    expect(initialsFromName("João Carlos da Silva")).toBe("JS");
    expect(initialsFromName("Ana")).toBe("AN");
  });

  it("formatCpfMasked preserva meio", () => {
    expect(formatCpfMasked("12345678909")).toBe("***.456.789-**");
  });

  it("membershipYearsLabel calcula anos", () => {
    expect(membershipYearsLabel("2020-03-14", new Date("2026-08-23"))).toBe("6 anos");
  });

  it("summary marca associação ativa", () => {
    const s = buildTrabalhadorSummary({
      membershipStatus: "ativo",
      membershipSince: "2020-03-14",
      hasActiveEmployment: true,
    });
    expect(s[0]?.value).toBe("Ativa");
    expect(s[0]?.tone).toBe("ok");
  });

  it("formatEmploymentPeriod", () => {
    expect(formatEmploymentPeriod("2020-01-01", null)).toBe("2020 — atual");
    expect(formatEmploymentPeriod("2017-01-01", "2020-06-01")).toBe("2017 — 2020");
  });
});
