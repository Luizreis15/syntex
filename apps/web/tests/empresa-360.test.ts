import { describe, expect, it } from "vitest";
import {
  buildEmpresaSummary,
  buildWorkerMix,
  type Empresa360Stats,
} from "@/features/companies/empresa-360-data";
import { buildRailFromTimeline } from "@/features/companies/components/empresa-360-status-rail";
import { demoWorkerBreakdown } from "@/features/companies/demo-empresa-360";

describe("empresa 360 compose", () => {
  const stats: Empresa360Stats = {
    workersActive: 40,
    membersActive: 28,
    openChargeCount: 2,
    openChargeAmount: 5800,
    overdueChargeCount: 1,
    overdueChargeAmount: 2400,
    openCharges: [],
  };

  it("summary usa trabalhadores e pendências reais", () => {
    const summary = buildEmpresaSummary(stats);
    expect(summary.find((s) => s.label === "Trabalhadores")?.value).toBe("40");
    expect(summary.find((s) => s.label === "Pendências")?.hint).toContain("2");
    expect(summary.find((s) => s.label === "Homologações")?.hint).toContain("demo");
  });

  it("worker mix mistura filiação real + incompleto demo", () => {
    const mix = buildWorkerMix(stats);
    expect(mix.source).toBe("mixed");
    expect(mix.rows[0]?.value).toBe(28);
  });

  it("demoWorkerBreakdown soma o total", () => {
    const rows = demoWorkerBreakdown(100);
    expect(rows.reduce((a, r) => a + r.value, 0)).toBe(100);
  });

  it("rail marca período vigente", () => {
    const stops = buildRailFromTimeline(
      [
        {
          valid_from: "2023-01-01",
          valid_until: "2025-12-31",
          status: "reconhecida",
        },
        {
          valid_from: "2026-01-01",
          valid_until: null,
          status: "disputada",
        },
      ],
      "disputada",
    );
    expect(stops.some((s) => s.current && s.state === "disputada")).toBe(true);
    expect(stops.some((s) => s.state === "future")).toBe(true);
  });
});
