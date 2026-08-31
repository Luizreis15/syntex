import { describe, expect, it } from "vitest";
import {
  calculateContributionAssessment,
  competenceIsWithinPlan,
  valueTypeForMethod,
} from "@/lib/domain/revenue-plan";

describe("planos de arrecadação — cálculo", () => {
  it("calcula piso × funcionários × percentual com arredondamento monetário", () => {
    const result = calculateContributionAssessment(
      { calculation_method: "floor_headcount_percentage", value: 1 },
      { headcount: 30, categoryFloor: 2100 },
    );
    expect(result.unitAmount).toBe(21);
    expect(result.amount).toBe(630);
    expect(result.formula).toBe("30 × 2100.00 × 1%");
  });

  it("calcula percentual sobre folha declarada", () => {
    const result = calculateContributionAssessment(
      { calculation_method: "declared_payroll_percentage", value: 1.5 },
      { declaredPayroll: 85000 },
    );
    expect(result.amount).toBe(1275);
  });

  it("calcula valor fixo por funcionário", () => {
    const result = calculateContributionAssessment(
      { calculation_method: "fixed_per_worker", value: 25 },
      { headcount: 12 },
    );
    expect(result.amount).toBe(300);
    expect(result.unitAmount).toBe(25);
  });

  it("calcula valor fixo por empresa sem solicitar base", () => {
    const result = calculateContributionAssessment(
      { calculation_method: "fixed_company", value: 420 },
      {},
    );
    expect(result.amount).toBe(420);
  });

  it("recusa cálculo sem os insumos exigidos pelo método", () => {
    expect(() => calculateContributionAssessment(
      { calculation_method: "floor_headcount_percentage", value: 1 },
      { headcount: 30 },
    )).toThrow("piso da categoria");
  });

  it("mapeia método percentual e fixo para o tipo persistido", () => {
    expect(valueTypeForMethod("floor_headcount_percentage")).toBe("percentual");
    expect(valueTypeForMethod("fixed_company")).toBe("valor_fixo");
  });

  it("respeita a vigência do plano na competência", () => {
    const plan = { valid_from: "2026-05-01", valid_until: "2027-04-30" };
    expect(competenceIsWithinPlan(plan, "2026-08-01")).toBe(true);
    expect(competenceIsWithinPlan(plan, "2027-05-01")).toBe(false);
  });
});

describe("planos — devedor × repassadora", () => {
  it("trabalhador + desconto em folha: empresa é repassadora, não devedora", async () => {
    const { resolveObligationParties } = await import("@/lib/domain/revenue-plan");
    const parties = resolveObligationParties(
      { liable_party: "worker", collection_role: "employer_remittance" },
      "company-1",
    );
    expect(parties).toEqual({
      debtor_kind: "worker",
      debtor_company_id: null,
      debtor_person_id: null,
      remitting_company_id: "company-1",
    });
  });

  it("empresa + pagamento direto: empresa é devedora sem repasse", async () => {
    const { resolveObligationParties } = await import("@/lib/domain/revenue-plan");
    const parties = resolveObligationParties(
      { liable_party: "company", collection_role: "direct" },
      "company-1",
    );
    expect(parties.debtor_kind).toBe("company");
    expect(parties.debtor_company_id).toBe("company-1");
    expect(parties.remitting_company_id).toBeNull();
  });
});

