import { describe, expect, it, vi } from "vitest";
import { buildHeroMetrics, buildOperationPulse, attachHeroProgress, buildLovableHeroBlock } from "@/features/dashboard/compose";
import {
  canAccessUnionDashboard,
  DASHBOARD_METRIC_PERMISSIONS,
  fetchUnionDashboard,
  type UnionDashboardMetrics,
} from "@/features/dashboard/data";
import { firstNameFromFullName, greetingForNow } from "@/features/dashboard/greeting";
import { filterNavSections, isBuiltNavItemVisible } from "@/components/layout/nav-config";
import * as permissions from "@syntex/permissions";
import type { UserGrant } from "@syntex/permissions";

function thenableCount(n: number) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = self;
  chain.eq = self;
  chain.in = self;
  chain.is = self;
  chain.then = (resolve: (v: unknown) => unknown) => resolve({ count: n, error: null });
  return chain;
}

describe("dashboard data — permission gates", () => {
  it("canAccessUnionDashboard exige ao menos uma permission de métrica", () => {
    expect(canAccessUnionDashboard([])).toBe(false);
    expect(canAccessUnionDashboard([{ role: "atendimento", scope: "tenant" }])).toBe(true);
  });

  it("sem grants não consulta nenhuma tabela e slots ficam null", async () => {
    const from = vi.fn();
    const metrics = await fetchUnionDashboard({ from } as never, "tenant-1", []);
    expect(from).not.toHaveBeenCalled();
    expect(metrics.companies).toBeNull();
    expect(metrics.workers).toBeNull();
    expect(metrics.chargesOpen).toBeNull();
    expect(metrics.membershipsActive).toBeNull();
  });

  it("atendimento (sem finance.read) não consulta charge — slot null ≠ 0", async () => {
    const called: string[] = [];
    const from = vi.fn((table: string) => {
      called.push(table);
      return thenableCount(4);
    });

    const grants: UserGrant[] = [{ role: "atendimento", scope: "tenant" }];
    const metrics = await fetchUnionDashboard({ from } as never, "tenant-1", grants);

    expect(called).not.toContain("charge");
    expect(metrics.chargesOpen).toBeNull();
    expect(metrics.companies).toBe(4);
    expect(metrics.workers).toBe(4);
    expect(metrics.membershipsActive).toBe(4);
  });
});

describe("Painel nav — alinhado ao gate da página", () => {
  it("DASHBOARD_METRIC_PERMISSIONS inclui finance.read e membership.read", () => {
    expect(DASHBOARD_METRIC_PERMISSIONS).toEqual([
      "company.read",
      "worker.read",
      "finance.read",
      "membership.read",
    ]);
  });

  it("finance.read sem company.read vê o item Painel e pode acessar o gate", () => {
    const canSpy = vi.spyOn(permissions, "can").mockImplementation((_grants, permission) => {
      return permission === "finance.read";
    });
    const hasSpy = vi.spyOn(permissions, "hasAnyGrant").mockImplementation((_grants, permission) => {
      return permission === "finance.read";
    });

    const grants: UserGrant[] = [{ role: "financeiro", scope: "tenant" }];
    const tenantId = "tenant-1";

    expect(canAccessUnionDashboard(grants)).toBe(true);

    const painel = {
      label: "Painel",
      built: true as const,
      href: "/painel",
      permissions: DASHBOARD_METRIC_PERMISSIONS,
      icon: "layout-grid" as const,
    };
    expect(isBuiltNavItemVisible(painel, grants, tenantId)).toBe(true);

    const sections = filterNavSections(grants, tenantId);
    const labels = sections.flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toContain("Painel");
    expect(labels).not.toContain("Empresas");

    canSpy.mockRestore();
    hasSpy.mockRestore();
  });

  it("Atendimento não aparece na nav Core (ADR-022)", () => {
    const grants: UserGrant[] = [
      { role: "atendimento", scope: "tenant" },
      { role: "admin", scope: "tenant" },
    ];
    const sections = filterNavSections(grants, "tenant-1");
    const labels = sections.flatMap((s) => s.items).map((i) => i.label);
    expect(labels).not.toContain("Atendimento");
    expect(labels).not.toContain("Comunicação");
    expect(labels).not.toContain("Benefícios");
    expect(labels).toEqual(
      expect.arrayContaining([
        "Painel",
        "Trabalhadores",
        "Empresas",
        "Representação",
        "Convenções",
        "Cobranças",
      ]),
    );
  });
});

describe("dashboard compose", () => {
  const base: UnionDashboardMetrics = {
    companies: 10,
    workers: 20,
    chargesOpen: 5,
    membershipsActive: 100,
    fetchedAt: new Date().toISOString(),
  };

  it("omite métricas com slot null (sem permission ≠ zero)", () => {
    const hero = buildHeroMetrics({
      ...base,
      chargesOpen: null,
      companies: null,
    });
    expect(hero.map((h) => h.key)).toEqual(["memberships", "workers"]);
  });

  it("pulse operacional temporal ainda vazio (sem reutilizar counts do header)", () => {
    const pulse = buildOperationPulse({
      companies: 10,
      workers: 20,
      chargesOpen: 2,
      membershipsActive: 100,
      fetchedAt: new Date().toISOString(),
    });
    expect(pulse).toHaveLength(0);
  });

  it("hierarquia visual: filiações/cobranças primary, empresas/trabalhadores secondary", () => {
    const hero = buildHeroMetrics(base);
    expect(hero.find((h) => h.key === "memberships")?.size).toBe("primary");
    expect(hero.find((h) => h.key === "charges")?.size).toBe("primary");
    expect(hero.find((h) => h.key === "companies")?.size).toBe("secondary");
    expect(hero.find((h) => h.key === "workers")?.size).toBe("secondary");
  });

  it("attachHeroProgress só com denominador real", () => {
    const hero = attachHeroProgress(buildHeroMetrics(base), {
      membershipsActive: 100,
      workersActive: 200,
      overdueCount: 2,
      openCount: 5,
    });
    expect(hero.find((h) => h.key === "memberships")?.progress?.value).toBe(50);
    expect(hero.find((h) => h.key === "charges")?.progress?.value).toBe(40);
    expect(hero.find((h) => h.key === "companies")?.progress).toBeUndefined();

    const withoutDenom = attachHeroProgress(buildHeroMetrics(base), {
      membershipsActive: 100,
      workersActive: 0,
      overdueCount: null,
      openCount: null,
    });
    expect(withoutDenom.find((h) => h.key === "memberships")?.progress).toBeUndefined();
    expect(withoutDenom.find((h) => h.key === "charges")?.progress).toBeUndefined();
  });

  it("buildLovableHeroBlock mistura seed real + arrecadação DEMO", () => {
    const block = buildLovableHeroBlock(base, {
      openCount: 10,
      openAmount: 1000,
      overdueCount: 2,
      overdueAmount: 200,
      dueIn30Count: 5,
      dueIn30Amount: 500,
      maxAmount: 100,
      buckets: [],
    });
    expect(block.associados?.value).toBe("100");
    expect(block.empresas?.value).toBe("10");
    expect(block.inadimplencia.source).toBe("real");
    expect(block.inadimplencia.value).toBe("20%");
    expect(block.arrecadacao.valueDisplay).toContain("R$");
  });
});

describe("dashboard greeting", () => {
  it("firstNameFromFullName usa só o primeiro nome", () => {
    expect(firstNameFromFullName("Mariana Lopes")).toBe("Mariana");
    expect(firstNameFromFullName("  ")).toBeNull();
    expect(firstNameFromFullName(null)).toBeNull();
  });

  it("greetingForNow retorna forma portuguesa", () => {
    expect(["Bom dia", "Boa tarde", "Boa noite"]).toContain(greetingForNow());
  });
});
