import { describe, expect, it } from "vitest";
import { admin } from "./helpers";

describe("invariantes estruturais (CLAUDE.md #1)", () => {
  it("RLS habilitada em 100% das tabelas de public", async () => {
    const { data, error } = await admin.rpc("test_tables_missing_rls");
    if (error) throw error;
    expect(data).toEqual([]);
  });

  it("toda tabela de tenant (tenant_id NOT NULL) tem UNIQUE (id, tenant_id)", async () => {
    const { data, error } = await admin.rpc("test_tenant_tables_missing_unique");
    if (error) throw error;
    expect(data).toEqual([]);
  });

  it("toda FK entre tabelas de tenant é composta", async () => {
    const { data, error } = await admin.rpc("test_tenant_fks_not_composite");
    if (error) throw error;
    expect(data).toEqual([]);
  });

  it("platform_notification é exceção control-plane nominal (ADR-019)", async () => {
    const { data, error } = await admin.rpc("test_platform_notification_is_control_plane_scoped");
    if (error) throw error;
    expect(data).toBe(true);
  });

  it("nenhuma tabela com tenant_id nullable fora da allowlist control-plane", async () => {
    const { data, error } = await admin.rpc("test_nullable_tenant_id_outside_allowlist");
    if (error) throw error;
    expect(data).toEqual([]);
  });
});
