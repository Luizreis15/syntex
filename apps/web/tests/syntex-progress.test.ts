import { describe, expect, it } from "vitest";
import { clampProgress } from "@/components/ui/syntex-progress";

describe("SyntexProgress / clampProgress", () => {
  it("clampa 0–100", () => {
    expect(clampProgress(-10)).toBe(0);
    expect(clampProgress(0)).toBe(0);
    expect(clampProgress(42.5)).toBe(42.5);
    expect(clampProgress(100)).toBe(100);
    expect(clampProgress(140)).toBe(100);
  });

  it("NaN → 0", () => {
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});
