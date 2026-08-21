import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { recordAudit, classificationOf } from "@syntex/database";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { createWorkerWithPerson, resolveMembership } from "@/lib/domain/worker";
import { isValidCpf } from "@/lib/formatters/cpf";

/** Gera CPF válido a partir de uma raiz de 9 dígitos. */
function cpfFromRoot(root9: string): string {
  const calc = (base: string) => {
    const start = base.length + 1;
    const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * (start - i), 0);
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };
  const dv1 = calc(root9);
  const dv2 = calc(root9 + dv1);
  return root9 + String(dv1) + String(dv2);
}

describe("person / worker / membership (Lote 4)", () => {
  let tenant: { id: string };
  let companyId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("people");
    const { data: company, error } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Empregadora" })
      .select()
      .single();
    if (error) throw error;
    companyId = company.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("classificação: person/worker=pessoal, membership=sensivel", () => {
    expect(classificationOf("person")).toBe("pessoal");
    expect(classificationOf("worker")).toBe("pessoal");
    expect(classificationOf("employment_relationship")).toBe("pessoal");
    expect(classificationOf("membership")).toBe("sensivel");
  });

  it("cria person+worker+membership+employment e outbox", async () => {
    const root = String(100_000_000 + (Date.now() % 800_000_000)).slice(0, 9);
    const cpf = cpfFromRoot(root);
    expect(isValidCpf(cpf)).toBe(true);

    const result = await createWorkerWithPerson(admin, tenant.id, {
      cpf,
      fullName: "Maria Trabalhadora",
      membershipStatus: "ativo",
      membershipValidFrom: "2024-01-15",
      companyId,
      employmentValidFrom: "2024-02-01",
      jobTitle: "Vendedora",
    });

    expect(result.person.cpf).toBe(cpf);
    expect(result.worker.person_id).toBe(result.person.id);
    expect(result.membership?.status).toBe("ativo");
    expect(result.membership?.data_classification).toBe("sensivel");
    expect(result.employment?.company_id).toBe(companyId);

    const { data: events } = await admin
      .from("outbox_event")
      .select("event_type")
      .eq("tenant_id", tenant.id)
      .in("aggregate_id", [result.person.id, result.worker.id, result.membership!.id]);
    const types = (events ?? []).map((e) => e.event_type).sort();
    expect(types).toEqual(expect.arrayContaining(["person.created", "worker.created", "membership.created"]));

    await recordAudit(admin, {
      tenantId: tenant.id,
      actorId: null,
      action: "read",
      table: "membership",
      resourceId: result.membership!.id,
    });
    const { data: logs } = await admin
      .from("audit_log")
      .select("data_classification")
      .eq("resource_id", result.membership!.id)
      .eq("resource_table", "membership");
    expect(logs?.[0]?.data_classification).toBe("sensivel");
  });

  it("CPF duplicado no tenant é rejeitado", async () => {
    const root = String(200_000_000 + (Date.now() % 700_000_000)).slice(0, 9);
    const cpf = cpfFromRoot(root);
    await createWorkerWithPerson(admin, tenant.id, { cpf, fullName: "Primeiro" });
    await expect(createWorkerWithPerson(admin, tenant.id, { cpf, fullName: "Segundo" })).rejects.toBeTruthy();
  });

  it("employment não sobrepõe mesmo worker+empresa", async () => {
    const root = String(300_000_000 + (Date.now() % 600_000_000)).slice(0, 9);
    const cpf = cpfFromRoot(root);
    const { worker } = await createWorkerWithPerson(admin, tenant.id, {
      cpf,
      fullName: "João Vínculo",
      companyId,
      employmentValidFrom: "2025-01-01",
    });

    const { error } = await admin.from("employment_relationship").insert({
      tenant_id: tenant.id,
      worker_id: worker.id,
      company_id: companyId,
      valid_from: "2025-06-01",
      status: "ativo",
      source: "manual",
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23P01");
  });

  it("resolveMembership devolve status vigente na data", async () => {
    const root = String(400_000_000 + (Date.now() % 500_000_000)).slice(0, 9);
    const cpf = cpfFromRoot(root);
    const { person } = await createWorkerWithPerson(admin, tenant.id, {
      cpf,
      fullName: "Ana Filiação",
      membershipStatus: "ativo",
      membershipValidFrom: "2023-01-01",
    });

    // Encerra e abre novo status (como a API de memberships)
    await admin
      .from("membership")
      .update({ valid_until: "2025-12-31" })
      .eq("person_id", person.id)
      .is("valid_until", null);

    await admin.from("membership").insert({
      tenant_id: tenant.id,
      person_id: person.id,
      status: "desfiliado",
      valid_from: "2026-01-01",
    });

    const in2024 = await resolveMembership(admin, tenant.id, person.id, "2024-06-01");
    expect(in2024?.status).toBe("ativo");

    const in2026 = await resolveMembership(admin, tenant.id, person.id, "2026-03-01");
    expect(in2026?.status).toBe("desfiliado");
  });
});
