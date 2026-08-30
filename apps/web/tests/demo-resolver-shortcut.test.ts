import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("atalho demo — resolver com companyId", () => {
  it("ResolveDuesForm aceita initialCompanyId", () => {
    const form = readFileSync(
      join(process.cwd(), "features/charges/resolve-dues-form.tsx"),
      "utf8",
    );
    expect(form).toContain("initialCompanyId");
  });

  it("Empresa 360 linka Gerar cobrança com companyId quando ativa", () => {
    const panel = readFileSync(
      join(process.cwd(), "features/companies/components/empresa-360-representacao.tsx"),
      "utf8",
    );
    expect(panel).toContain("/cobrancas/resolver?companyId=${companyId}");
    expect(panel).toContain("representationStatusLabel");
  });
});
