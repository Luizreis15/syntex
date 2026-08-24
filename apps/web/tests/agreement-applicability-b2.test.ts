import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveRepresentationQuerySchema } from "@syntex/validation";

describe("B2 — aplicabilidade CCT na data", () => {
  it("schema resolve exige establishmentId + date", () => {
    expect(
      resolveRepresentationQuerySchema.safeParse({
        establishmentId: "11111111-1111-1111-1111-111111111111",
        date: "2026-06-01",
      }).success,
    ).toBe(true);
    expect(
      resolveRepresentationQuerySchema.safeParse({
        establishmentId: "11111111-1111-1111-1111-111111111111",
      }).success,
    ).toBe(false);
  });

  it("UI Convenções tem resolver aplicabilidade", () => {
    const form = readFileSync(
      join(process.cwd(), "features/agreements/resolve-agreement-applicability-form.tsx"),
      "utf8",
    );
    expect(form).toContain("Resolver aplicabilidade");
    expect(form).toContain("/resolve?");
    expect(form).toContain("/representacao/");
    expect(form).toContain("/convencoes/");
    expect(form).toMatch(/reconhecida/);

    const page = readFileSync(
      join(process.cwd(), "app/(shell)/convencoes/page.tsx"),
      "utf8",
    );
    expect(page).toContain("ResolveAgreementApplicabilityForm");
    expect(page).toContain("representation.read");
  });

  it("links cruzados 360 e workspace apontam para convenção com date", () => {
    const panel = readFileSync(
      join(process.cwd(), "features/companies/components/empresa-360-representacao.tsx"),
      "utf8",
    );
    expect(panel).toContain("/convencoes/${resolution.agreement.id}?date=${date}");

    const { readdirSync } = require("node:fs") as typeof import("node:fs");
    const featName = readdirSync(join(process.cwd(), "features")).find((n) =>
      n.startsWith("rep"),
    );
    expect(featName).toBeTruthy();
    const view = readFileSync(
      join(process.cwd(), "features", featName!, "components/representation-workspace-view.tsx"),
      "utf8",
    );
    expect(view).toContain("?date=${workspace.referenceDate}");
    expect(view).toContain('name="date"');
  });
});
