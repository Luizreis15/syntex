import { describe, expect, it } from "vitest";
import { admin } from "./helpers";

describe("invariantes estruturais (CLAUDE.md #1)", () => {
  it("RLS habilitada em 100% das tabelas de public", async () => {
    const { data, error } = await admin.rpc("test_tables_missing_rls");
    if (error) throw error;
    expect(data).toEqual([]);
  });

  it("toda tabela de tenant tem UNIQUE (id, tenant_id)", async () => {
    const { data, error } = await admin.rpc("test_tenant_tables_missing_unique");
    if (error) throw error;
    expect(data).toEqual([]);
  });

  it("toda FK entre tabelas de tenant é composta", async () => {
    const { data, error } = await admin.rpc("test_tenant_fks_not_composite");
    if (error) throw error;
    expect(data).toEqual([]);
  });
});
