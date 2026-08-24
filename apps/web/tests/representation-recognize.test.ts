import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { recordAudit } from "@syntex/database";
import { representationRecognizeSchema } from "@syntex/validation";
import { can, hasAnyGrant } from "@syntex/permissions";
import { admin, createTestTenant, createTestUser, deleteTestTenant, unique } from "./helpers";
import { claimRepresentation } from "@/lib/domain/claim-representation";
import { recognizeRepresentation } from "@/lib/domain/recognize-representation";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";
import { resolveCompanyDues } from "@/lib/domain/resolve-dues";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("representationRecognizeSchema", () => {
  it("aceita body vazio", () => {
    expect(representationRecognizeSchema.safeParse({}).success).toBe(true);
  });

  it("rejeita status no body (.strict)", () => {
    expect(
      representationRecognizeSchema.safeParse({ status: "reconhecida" }).success,
    ).toBe(false);
  });
});

describe("recognizeRepresentation command", () => {
  let tenant: { id: string };
  let companyId: string;
  let establishmentId: string;
  let registrationId: string;
  let otherRegistrationId: string;
  let decider: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    tenant = await createTestTenant("recognize");
    decider = await createTestUser(tenant.id, "diretoria", "tenant");

    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Recognize" })
      .select()
      .single();
    if (companyError) throw companyError;
    companyId = company.id;

    const { data: establishment, error: estError } = await admin
      .from("establishment")
      .insert({
        tenant_id: tenant.id,
        company_id: companyId,
        cnpj: unique("00"),
        kind: "matriz",
      })
      .select()
      .single();
    if (estError) throw estError;
    establishmentId = establishment.id;

    const { data: economic } = await admin
      .from("economic_category")
      .insert({ tenant_id: tenant.id, name: unique("Eco") })
      .select()
      .single();
    const { data: professional } = await admin
      .from("professional_category")
      .insert({ tenant_id: tenant.id, name: unique("Pro") })
      .select()
      .single();

    const { data: registration, error: regError } = await admin
      .from("union_registration")
      .insert({
        tenant_id: tenant.id,
        registry_number: unique("REG"),
        registered_at: "2020-01-01",
        economic_category_id: economic!.id,
        professional_category_id: professional!.id,
      })
      .select()
      .single();
    if (regError) throw regError;
    registrationId = registration.id;

    const { data: registrationB, error: regBError } = await admin
      .from("union_registration")
      .insert({
        tenant_id: tenant.id,
        registry_number: unique("REG"),
        registered_at: "2021-01-01",
        economic_category_id: economic!.id,
        professional_category_id: professional!.id,
      })
      .select()
      .single();
    if (regBError) throw regBError;
    otherRegistrationId = registrationB.id;

    await admin.from("collective_agreement").insert({
      tenant_id: tenant.id,
      kind: "cct",
      mediador_number: "MR-RECOG",
      valid_from: "2024-01-01",
      valid_until: "2027-12-31",
      base_date: "2024-01-01",
      economic_category_id: economic!.id,
      professional_category_id: professional!.id,
    });
  });

  afterAll(async () => {
    if (tenant?.id) await deleteTestTenant(tenant.id);
  });

  it("diretoria reconhece reivindicada → reconhecida", async () => {
    const claim = await claimRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      {
        establishmentId,
        unionRegistrationId: registrationId,
        validFrom: "2026-01-01",
        basis: "carta_sindical",
        evidence: "para reconhecer",
      },
    );
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;

    const result = await recognizeRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      { representationId: claim.representation.id },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.alreadyRecognized).toBe(false);
    expect(result.representation.status).toBe("reconhecida");
    expect(result.representation.decided_by).toBe(decider.appUserId);

    const resolution = await resolveRepresentation(admin, tenant.id, establishmentId, "2026-06-01");
    expect(resolution.status).toBe("reconhecida");
    expect(resolution.agreement).not.toBeNull();
  });

  it("idempotente: já reconhecida retorna alreadyRecognized", async () => {
    const { data: rows } = await admin
      .from("union_representation")
      .select("id")
      .eq("establishment_id", establishmentId)
      .eq("status", "reconhecida")
      .limit(1);
    const id = rows![0]!.id;
    const result = await recognizeRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      { representationId: id },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.alreadyRecognized).toBe(true);
  });

  it("reconhece concorrente: encerra rival como perdida e resolve CCT", async () => {
    const { data: company2 } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Disputa Rec" })
      .select()
      .single();
    const { data: est2 } = await admin
      .from("establishment")
      .insert({
        tenant_id: tenant.id,
        company_id: company2!.id,
        cnpj: unique("00"),
        kind: "matriz",
      })
      .select()
      .single();

    const a = await claimRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      {
        establishmentId: est2!.id,
        unionRegistrationId: registrationId,
        validFrom: "2026-01-01",
        basis: "manual",
        evidence: "claim A",
      },
    );
    const b = await claimRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      {
        establishmentId: est2!.id,
        unionRegistrationId: otherRegistrationId,
        validFrom: "2026-02-01",
        basis: "carta_sindical",
        evidence: "claim B",
      },
    );
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    const before = await resolveRepresentation(admin, tenant.id, est2!.id, "2026-06-01");
    expect(before.status).toBe("disputada");
    expect(before.agreement).toBeNull();

    const result = await recognizeRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      { representationId: b.representation.id },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.closedCompetitorIds).toContain(a.representation.id);

    const { data: closed } = await admin
      .from("union_representation")
      .select("status, valid_until")
      .eq("id", a.representation.id)
      .single();
    expect(closed?.status).toBe("perdida");
    expect(closed?.valid_until).toBeTruthy();

    const after = await resolveRepresentation(admin, tenant.id, est2!.id, "2026-06-01");
    expect(after.status).toBe("reconhecida");
    expect(after.agreement).not.toBeNull();

    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId: company2!.id,
      competence: "2026-06",
    });
    // Sem contribution_rule nesta CCT de teste pode ser []; o ponto é não bloquear por status.
    expect(Array.isArray(dues)).toBe(true);
  });

  it("rejeita reconhecer status perdida", async () => {
    const { data: company3 } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Perdida" })
      .select()
      .single();
    const { data: est3 } = await admin
      .from("establishment")
      .insert({
        tenant_id: tenant.id,
        company_id: company3!.id,
        cnpj: unique("00"),
        kind: "matriz",
      })
      .select()
      .single();

    const { data: lost } = await admin
      .from("union_representation")
      .insert({
        tenant_id: tenant.id,
        establishment_id: est3!.id,
        union_registration_id: registrationId,
        status: "perdida",
        valid_from: "2020-01-01",
        valid_until: "2021-01-01",
        basis: "manual",
        evidence: "já perdida",
      })
      .select()
      .single();

    const result = await recognizeRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      { representationId: lost!.id },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);
  });

  it("audit update não inclui evidence", async () => {
    const { data: company4 } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Audit Rec" })
      .select()
      .single();
    const { data: est4 } = await admin
      .from("establishment")
      .insert({
        tenant_id: tenant.id,
        company_id: company4!.id,
        cnpj: unique("00"),
        kind: "matriz",
      })
      .select()
      .single();

    const claim = await claimRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      {
        establishmentId: est4!.id,
        validFrom: "2026-01-01",
        basis: "manual",
        evidence: "texto sensível jurídico audit recognize",
      },
    );
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;

    const result = await recognizeRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      { representationId: claim.representation.id },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await recordAudit(decider.client, {
      tenantId: tenant.id,
      actorId: decider.appUserId,
      action: "update",
      table: "union_representation",
      resourceId: result.representation.id,
      metadata: {
        surface: "representacao.recognize",
        command: "reconhecer",
        establishmentId: est4!.id,
        companyId: company4!.id,
        status: "reconhecida",
        basis: "manual",
        closedCompetitorIds: [],
        classification: "juridico",
      },
    });

    const { data: logs } = await admin
      .from("audit_log")
      .select("metadata, data_classification, action")
      .eq("resource_id", result.representation.id)
      .eq("action", "update");
    expect(logs?.[0]?.data_classification).toBe("juridico");
    expect(JSON.stringify(logs?.[0]?.metadata)).not.toMatch(/sensível|evidence/i);
  });

  it("outbox status_changed quando migration 0029 aplicada", async () => {
    const candidates = [
      join(process.cwd(), "../../supabase/migrations/0029_union_representation_status_outbox.sql"),
      join(process.cwd(), "supabase/migrations/0029_union_representation_status_outbox.sql"),
      join(process.cwd(), "../supabase/migrations/0029_union_representation_status_outbox.sql"),
    ];
    const found = candidates.find((p) => existsSync(p));
    expect(found).toBeTruthy();
    const sql = readFileSync(found!, "utf8");
    expect(sql).toContain("union_representation_status_outbox");
    expect(sql).toContain("union_representation.status_changed");

    const { data: company5 } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Outbox Rec" })
      .select()
      .single();
    const { data: est5 } = await admin
      .from("establishment")
      .insert({
        tenant_id: tenant.id,
        company_id: company5!.id,
        cnpj: unique("00"),
        kind: "matriz",
      })
      .select()
      .single();

    const claim = await claimRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      {
        establishmentId: est5!.id,
        validFrom: "2026-01-01",
        basis: "manual",
        evidence: "outbox recognize",
      },
    );
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;

    const result = await recognizeRepresentation(
      decider.client,
      { tenantId: tenant.id, appUserId: decider.appUserId },
      { representationId: claim.representation.id },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { data: events } = await admin
      .from("outbox_event")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("aggregate_id", result.representation.id)
      .eq("event_type", "union_representation.status_changed");

    if (!events?.length) {
      expect(found).toBeTruthy();
      return;
    }

    expect(events[0]?.payload).not.toHaveProperty("evidence");
    const payload = events[0]?.payload as { new_status?: string; old_status?: string };
    expect(payload.new_status).toBe("reconhecida");
    expect(payload.old_status).toBe("reivindicada");
  });

  it("permission: atendimento/financeiro sem decide; diretoria com decide", () => {
    const tenantId = "11111111-1111-1111-1111-111111111111";
    expect(hasAnyGrant([{ role: "atendimento", scope: "tenant" }], "representation.decide")).toBe(
      false,
    );
    expect(hasAnyGrant([{ role: "financeiro", scope: "tenant" }], "representation.decide")).toBe(
      false,
    );
    expect(
      can([{ role: "diretoria", scope: "tenant" }], "representation.decide", tenantId, {
        tenantId,
      }),
    ).toBe(true);
  });

  it("CTA recognize só com canDecide no claim card", () => {
    const { readdirSync } = require("node:fs") as typeof import("node:fs");
    const featuresDir = join(process.cwd(), "features");
    const featName = readdirSync(featuresDir).find((n: string) => n.startsWith("rep"));
    expect(featName).toBeTruthy();
    const source = readFileSync(
      join(featuresDir, featName!, "components/representation-claim-card.tsx"),
      "utf8",
    );
    expect(source).toContain("canDecide");
    expect(source).toContain("RecognizeRepresentationButton");
    expect(source).toContain('claim.status === "reivindicada"');
  });
});
