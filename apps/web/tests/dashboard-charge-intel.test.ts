import { describe, expect, it } from "vitest";
import {
  aggregateOpenCharges,
  sortAttentionCharges,
  type OpenChargeInput,
} from "@/features/dashboard/charge-intel";

const REF = "2026-08-22";

function row(partial: Partial<OpenChargeInput> & Pick<OpenChargeInput, "dueDate" | "status">): OpenChargeInput {
  return { amount: 100, ...partial };
}

describe("aggregateOpenCharges", () => {
  it("zero rows → zeros", () => {
    const intel = aggregateOpenCharges([], REF);
    expect(intel.openCount).toBe(0);
    expect(intel.openAmount).toBe(0);
    expect(intel.overdueCount).toBe(0);
    expect(intel.dueIn30Count).toBe(0);
    expect(intel.maxAmount).toBe(0);
  });

  it("ignora status pago/cancelado", () => {
    const intel = aggregateOpenCharges(
      [
        row({ status: "pago", dueDate: "2026-08-01", amount: 999 }),
        row({ status: "pendente", dueDate: "2026-08-27", amount: 150 }),
      ],
      REF,
    );
    expect(intel.openCount).toBe(1);
    expect(intel.openAmount).toBe(150);
  });

  it("total aberto e vencido", () => {
    const intel = aggregateOpenCharges(
      [
        row({ status: "vencido", dueDate: "2026-08-01", amount: 200 }),
        row({ status: "pendente", dueDate: "2026-09-01", amount: 300 }),
        row({ status: "pendente", dueDate: "2026-08-10", amount: 50 }), // passado + pendente = vencido por data
      ],
      REF,
    );
    expect(intel.openCount).toBe(3);
    expect(intel.openAmount).toBe(550);
    expect(intel.overdueCount).toBe(2);
    expect(intel.overdueAmount).toBe(250);
  });

  it("próximos 30 dias (boundary inclusivo)", () => {
    const intel = aggregateOpenCharges(
      [
        row({ status: "pendente", dueDate: "2026-08-22", amount: 10 }), // hoje
        row({ status: "pendente", dueDate: "2026-08-29", amount: 20 }), // +7
        row({ status: "pendente", dueDate: "2026-09-21", amount: 30 }), // +30
        row({ status: "pendente", dueDate: "2026-09-22", amount: 40 }), // +31 fora
        row({ status: "vencido", dueDate: "2026-08-01", amount: 50 }), // não entra em 30d
      ],
      REF,
    );
    expect(intel.dueIn30Count).toBe(3);
    expect(intel.dueIn30Amount).toBe(60);
  });

  it("maxAmount e buckets por vencimento", () => {
    const intel = aggregateOpenCharges(
      [
        row({ status: "vencido", dueDate: "2026-07-01", amount: 1000 }),
        row({ status: "pendente", dueDate: "2026-08-25", amount: 100 }),
        row({ status: "pendente", dueDate: "2026-09-01", amount: 200 }),
        row({ status: "pendente", dueDate: "2026-10-01", amount: 50 }),
      ],
      REF,
    );
    expect(intel.maxAmount).toBe(1000);
    const map = Object.fromEntries(intel.buckets.map((b) => [b.key, b.count]));
    expect(map.vencidas).toBe(1);
    expect(map.d0_7).toBe(1);
    expect(map.d8_15).toBe(1);
    expect(map.d31_60).toBe(1);
  });
});

describe("sortAttentionCharges", () => {
  it("prioriza vencidas, depois vencimento mais próximo", () => {
    const sorted = sortAttentionCharges(
      [
        row({ status: "pendente", dueDate: "2026-09-10", amount: 1 }),
        row({ status: "vencido", dueDate: "2026-08-01", amount: 2 }),
        row({ status: "pendente", dueDate: "2026-08-25", amount: 3 }),
        row({ status: "pendente", dueDate: "2026-08-10", amount: 4 }), // passado
      ],
      REF,
    );
    expect(sorted.map((r) => r.amount)).toEqual([2, 4, 3, 1]);
  });
});
