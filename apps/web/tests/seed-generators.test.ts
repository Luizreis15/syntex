import { describe, expect, it } from "vitest";
import {
  buildActiveHeadcountByCompany,
  createPrng,
  generateDemoCpf,
  isStructurallyValidCpf,
  parseReferenceDate,
  addDaysIso,
} from "../scripts/lib/seed-generators";
import {
  buildWorkforcePlan,
  DEMO_ACTIVE_MEMBERSHIPS,
  DEMO_ACTIVE_WORKERS,
  DEMO_HISTORICAL_WORKERS,
} from "../scripts/data/demo-people";
import {
  buildOpenChargePlan,
  DEMO_OPEN_CHARGES,
  DEMO_OVERDUE_CHARGES,
  DEMO_PENDING_CHARGES,
  listCompetenceMonthsInclusive,
  pickAgreementCoveringDate,
} from "../scripts/data/demo-finance";
import { DEMO_COMPANIES } from "../scripts/data/demo-companies";
import { assertSeedEnvironmentAllowed, resolveSeedReferenceDate } from "../scripts/lib/seed-safety";

describe("seed-generators", () => {
  it("gera o mesmo CPF para o mesmo índice", () => {
    expect(generateDemoCpf(0)).toBe(generateDemoCpf(0));
    expect(generateDemoCpf(42)).toBe(generateDemoCpf(42));
    expect(generateDemoCpf(0)).not.toBe(generateDemoCpf(1));
  });

  it("CPF tem 11 dígitos e DV estruturalmente válido", () => {
    for (const i of [0, 1, 17, 999, 10_000]) {
      const cpf = generateDemoCpf(i);
      expect(cpf).toMatch(/^\d{11}$/);
      expect(isStructurallyValidCpf(cpf)).toBe(true);
    }
  });

  it("PRNG é determinístico", () => {
    const a = createPrng(123);
    const b = createPrng(123);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("distribuição de headcount soma o alvo", () => {
    const counts = buildActiveHeadcountByCompany(DEMO_COMPANIES.length, DEMO_ACTIVE_WORKERS);
    expect(counts.reduce((s, n) => s + n, 0)).toBe(DEMO_ACTIVE_WORKERS);
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(60);
  });
});

describe("demo-people / demo-finance plans", () => {
  const referenceDate = "2026-08-22";

  it("workforce atinge metas de ativos e filiações", () => {
    const plan = buildWorkforcePlan({
      companyCount: DEMO_COMPANIES.length,
      companyBranchNames: DEMO_COMPANIES.map((c) => c.branch),
      companyHasFilial: DEMO_COMPANIES.map((c) => Boolean(c.filial)),
      referenceDate,
    });
    expect(plan.filter((p) => p.status === "ativo")).toHaveLength(DEMO_ACTIVE_WORKERS);
    expect(plan.filter((p) => p.status === "encerrado")).toHaveLength(DEMO_HISTORICAL_WORKERS);
    expect(plan.filter((p) => p.withActiveMembership)).toHaveLength(DEMO_ACTIVE_MEMBERSHIPS);
    const cpfs = new Set(plan.map((p) => p.cpf));
    expect(cpfs.size).toBe(plan.length);
    expect(plan.every((p) => !p.fullName.includes("Trabalhador"))).toBe(true);
  });

  it("cobranças abertas: pendente/vencido com datas relativas à referência", () => {
    const charges = buildOpenChargePlan({
      companyCount: DEMO_COMPANIES.length,
      referenceDate,
    });
    expect(charges).toHaveLength(DEMO_OPEN_CHARGES);
    expect(charges.filter((c) => c.status === "pendente")).toHaveLength(DEMO_PENDING_CHARGES);
    expect(charges.filter((c) => c.status === "vencido")).toHaveLength(DEMO_OVERDUE_CHARGES);
    expect(charges.every((c) => c.status === "pendente" || c.status === "vencido")).toBe(true);

    for (const c of charges) {
      if (c.status === "pendente") {
        expect(c.dueDate > referenceDate).toBe(true);
      } else {
        expect(c.dueDate < referenceDate).toBe(true);
      }
    }

    const keys = new Set(charges.map((c) => `${c.companyIndex}:${c.competenceYm}`));
    expect(keys.size).toBe(charges.length);
  });

  it("C3: competências sob CCT 2026 cobrem a referência do seed", () => {
    const months = listCompetenceMonthsInclusive("2026-05-01", "2027-04-30", referenceDate);
    expect(months[0]).toBe("2026-05");
    expect(months.at(-1)).toBe("2026-08");
    expect(months).toContain("2026-08");

    const picked = pickAgreementCoveringDate(
      [
        { valid_from: "2025-05-01", valid_until: "2026-04-30", mediador: "2025" },
        { valid_from: "2026-05-01", valid_until: "2027-04-30", mediador: "2026" },
      ],
      referenceDate,
    );
    expect(picked?.mediador).toBe("2026");

    const charges = buildOpenChargePlan({
      companyCount: DEMO_COMPANIES.length,
      referenceDate,
      agreementValidFrom: "2026-05-01",
      agreementValidUntil: "2027-04-30",
    });
    expect(charges.every((c) => c.competenceYm >= "2026-05" && c.competenceYm <= "2026-08")).toBe(
      true,
    );
    const keys = new Set(charges.map((c) => `${c.companyIndex}:${c.competenceYm}`));
    expect(keys.size).toBe(charges.length);
  });

  it("addDaysIso e parseReferenceDate", () => {
    expect(addDaysIso("2026-08-22", 5)).toBe("2026-08-27");
    expect(addDaysIso("2026-08-22", -3)).toBe("2026-08-19");
    expect(parseReferenceDate(undefined, "2026-08-22")).toBe("2026-08-22");
    expect(parseReferenceDate("2026-01-15", "2026-08-22")).toBe("2026-01-15");
    expect(() => parseReferenceDate("nope", "2026-08-22")).toThrow();
  });
});

describe("seed-safety", () => {
  it("bloqueia production", () => {
    expect(() =>
      assertSeedEnvironmentAllowed({
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      }),
    ).toThrow(/NODE_ENV/);
    expect(() =>
      assertSeedEnvironmentAllowed({
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      }),
    ).toThrow(/VERCEL_ENV/);
  });

  it("exige flag em remoto DEV", () => {
    expect(() =>
      assertSeedEnvironmentAllowed({
        NODE_ENV: "development",
        NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co",
      }),
    ).toThrow(/SYNTEX_ALLOW_REMOTE_DEV_SEED/);

    expect(
      assertSeedEnvironmentAllowed({
        NODE_ENV: "development",
        NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co",
        SYNTEX_ALLOW_REMOTE_DEV_SEED: "1",
      }).isRemote,
    ).toBe(true);
  });

  it("localhost não exige flag remota", () => {
    expect(
      assertSeedEnvironmentAllowed({
        NODE_ENV: "development",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }).isRemote,
    ).toBe(false);
  });

  it("resolve referência temporal", () => {
    expect(resolveSeedReferenceDate({})).toBe("2026-08-22");
    expect(resolveSeedReferenceDate({ SYNTEX_SEED_REFERENCE_DATE: "2026-09-01" })).toBe(
      "2026-09-01",
    );
  });
});
