import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, createTestUser, deleteTestTenant, unique } from "./helpers";
import { recordAudit } from "@syntex/database";

describe("outbox transacional e auditoria (CLAUDE.md #4 e #5)", () => {
  let tenant: { id: string };

  beforeAll(async () => {
    tenant = await createTestTenant("audit-outbox");
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("criar empresa grava outbox_event na mesma transação", async () => {
    const cnpj = unique("00");
    const { data: company, error } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj, legal_name: "Empresa Outbox" })
      .select()
      .single();
    if (error) throw error;

    const { data: events, error: eventsError } = await admin
      .from("outbox_event")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("aggregate_id", company.id);
    if (eventsError) throw eventsError;

    expect(events).toHaveLength(1);
    expect(events[0]?.aggregate_type).toBe("company");
    expect(events[0]?.event_type).toBe("company.created");
  });

  it("transação revertida não deixa outbox_event órfão", async () => {
    const cnpj = unique("00");
    const { error } = await admin.rpc("test_rollback_company_insert", { p_tenant_id: tenant.id, p_cnpj: cnpj });
    expect(error).not.toBeNull();
    expect(error?.message).toContain("forced_rollback_for_test");

    const { data: company } = await admin.from("company").select("id").eq("cnpj", cnpj).maybeSingle();
    expect(company).toBeNull();

    // Nenhum outbox_event pode referenciar uma empresa que nunca chegou a
    // existir — todo evento company.created deste tenant tem que apontar
    // para uma linha de company que de fato existe.
    const { data: events, error: eventsError } = await admin
      .from("outbox_event")
      .select("aggregate_id")
      .eq("tenant_id", tenant.id)
      .eq("event_type", "company.created");
    if (eventsError) throw eventsError;

    for (const event of events ?? []) {
      const { data: matching } = await admin
        .from("company")
        .select("id")
        .eq("id", event.aggregate_id)
        .maybeSingle();
      expect(matching).not.toBeNull();
    }
  });

  it("leitura de dado classificado registra a classificação no audit_log", async () => {
    const { data: company, error } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Auditada" })
      .select()
      .single();
    if (error) throw error;

    await recordAudit(admin, {
      tenantId: tenant.id,
      actorId: null,
      action: "read",
      table: "company",
      resourceId: company.id,
    });

    const { data: logs, error: logsError } = await admin
      .from("audit_log")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("resource_id", company.id);
    if (logsError) throw logsError;

    expect(logs).toHaveLength(1);
    expect(logs[0]?.data_classification).toBe("interno");
  });

  it("audit_log é append-only para a aplicação: UPDATE e DELETE são rejeitados", async () => {
    // A trava vale para o caminho da aplicação (anon + JWT do usuário) — não
    // para service_role, que já tem privilégio equivalente a DBA e precisa
    // conseguir expurgar por política de retenção. Por isso o teste usa um
    // usuário autenticado normal, não o cliente admin.
    const user = await createTestUser(tenant.id, "admin", "tenant");

    const { data: log, error } = await admin
      .from("audit_log")
      .insert({
        tenant_id: tenant.id,
        actor_id: user.appUserId,
        action: "read",
        resource_table: "company",
        data_classification: "interno",
      })
      .select()
      .single();
    if (error) throw error;

    // Sem policy de UPDATE/DELETE para o papel autenticado, o RLS não dá erro
    // — só filtra a linha e a operação afeta zero registros. A garantia real
    // (e o que o trigger da 0006 cobre como cinto e suspensório) é que o
    // conteúdo não muda e a linha continua existindo.
    const { error: updateError } = await user.client.from("audit_log").update({ action: "delete" }).eq("id", log.id);
    expect(updateError).toBeNull();

    const { data: afterUpdate } = await admin.from("audit_log").select("action").eq("id", log.id).single();
    expect(afterUpdate?.action).toBe("read");

    const { error: deleteError } = await user.client.from("audit_log").delete().eq("id", log.id);
    expect(deleteError).toBeNull();

    const { data: afterDelete } = await admin.from("audit_log").select("id").eq("id", log.id).maybeSingle();
    expect(afterDelete).not.toBeNull();
  });
});
