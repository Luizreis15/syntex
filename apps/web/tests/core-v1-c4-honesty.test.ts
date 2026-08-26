import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * C4 — honesty: blocos DEMO do Painel / Empresa 360 devem ser rotulados.
 */
describe("C4 — honesty DEMO Painel / Empresa 360", () => {
  it("DevDemoMark existe e é usado no Painel e Empresa 360", () => {
    const mark = readFileSync(join(process.cwd(), "components/ui/dev-demo-mark.tsx"), "utf8");
    expect(mark).toContain("DevDemoBadge");
    expect(mark).toContain("DevDemoNotice");

    const painel = readFileSync(join(process.cwd(), "app/(shell)/painel/page.tsx"), "utf8");
    expect(painel).toContain("DevDemoNotice");

    const empresa = readFileSync(join(process.cwd(), "app/(shell)/empresas/[id]/page.tsx"), "utf8");
    expect(empresa).toContain("DevDemoNotice");
  });

  it("painéis DEMO do dashboard passam demo={true}", () => {
    const files = [
      "features/dashboard/components/dashboard-arrecadacao-chart.tsx",
      "features/dashboard/components/dashboard-operation-now.tsx",
      "features/dashboard/components/dashboard-alertas.tsx",
      "features/dashboard/components/dashboard-movimento-base.tsx",
      "features/companies/components/empresa-360-arrecadacao.tsx",
      "features/companies/components/empresa-360-timeline.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      expect(src, rel).toMatch(/\bdemo\b/);
    }

    const intel = readFileSync(
      join(process.cwd(), "features/dashboard/components/dashboard-intelligence.tsx"),
      "utf8",
    );
    expect(intel).toContain("DevDemoBadge");
    expect(intel).not.toMatch(/Não exibir rótulo/);
  });

  it("DashboardPanel aceita prop demo", () => {
    const panel = readFileSync(
      join(process.cwd(), "features/dashboard/components/dashboard-panel.tsx"),
      "utf8",
    );
    expect(panel).toContain("demo?: boolean");
    expect(panel).toContain("DevDemoBadge");
  });
});
