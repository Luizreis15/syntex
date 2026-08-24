import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  listCompetenceMonthsInclusive,
  pickAgreementCoveringDate,
} from "../scripts/data/demo-finance";
import { resolveSeedReferenceDate } from "../scripts/lib/seed-safety";

/**
 * C3 — gaps de seed que travavam o runbook Core V1:
 * CCT cobrindo a referência temporal + usuário só financeiro.
 */
describe("C3 — seed gaps do roteiro", () => {
  it("seed inclui CCT 2026 e login financeiro puro", () => {
    const seed = readFileSync(join(process.cwd(), "scripts/seed.ts"), "utf8");
    expect(seed).toContain("MR024310/2026");
    expect(seed).toContain('valid_from: "2026-05-01"');
    expect(seed).toContain('valid_until: "2027-04-30"');
    expect(seed).toContain("financeiro@secabc.exemplo.org.br");
    expect(seed).toContain("pickAgreementCoveringDate");
    expect(seed).toMatch(/grantRole\([\s\S]*roles\.financeiro/);
  });

  it("referência default do seed cai na vigência da CCT 2026", () => {
    const referenceDate = resolveSeedReferenceDate({});
    expect(referenceDate).toBe("2026-08-22");

    const covering = pickAgreementCoveringDate(
      [
        {
          mediador_number: "MR021897/2025",
          valid_from: "2025-05-01",
          valid_until: "2026-04-30",
        },
        {
          mediador_number: "MR024310/2026",
          valid_from: "2026-05-01",
          valid_until: "2027-04-30",
        },
      ],
      referenceDate,
    );
    expect(covering?.mediador_number).toBe("MR024310/2026");

    const months = listCompetenceMonthsInclusive(
      covering!.valid_from,
      covering!.valid_until,
      referenceDate,
    );
    expect(months).toContain("2026-08");
  });
});
