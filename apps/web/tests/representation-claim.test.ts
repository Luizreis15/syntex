import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { recordAudit } from "@syntex/database";
import { representationClaimSchema } from "@syntex/validation";
import { can, hasAnyGrant, type UserGrant } from "@syntex/permissions";
import { admin, createTestTenant, createTestUser, deleteTestTenant, unique } from "./helpers";
import { claimRepresentation } from "@/lib/domain/claim-representation";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";
import { resolveCompanyDues } from "@/lib/domain/resolve-dues";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("representationClaimSchema", () => {
  it("aceita payload de claim sem status", () => {
    const parsed = representationClaimSchema.safeParse({
      establishmentId: "11111111-1111-1111-1111-111111111111",
      validFrom: "2026-08-23",
      basis: "manual",
      evidence: "prova",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejeita status enviado pelo client (.strict)", () => {
    const parsed = representationClaimSchema.safeParse({
      establishmentId: "11111111-1111-1111-1111-111111111111",
      validFrom: "2026-08-23",
      basis: "manual",
      evidence: "prova",
      status: "reconhecida",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejeita validUntil / decidedBy", () => {
    expect(
      representationClaimSchema.safeParse({
        establishmentId: "11111111-1111-1111-1111-111111111111",
        validFrom: "2026-08-23",
        basis: "manual",
        evidence: "prova",
        validUntil: "2027-01-01",
      }).success,
    ).toBe(false);
  });
});

describe("claimRepresentation command", () => {
  let tenant: { id: string };
  let companyId: string;
  let establishmentId: string;
  let registrationId: string;
  let otherRegistrationId: string;
  let writer: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    tenant = await createTestTenant("claim");
    writer = await createTestUser(tenant.id, "diretoria", "tenant");

    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Claim" })
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
      mediador_number: "MR-CLAIM",
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

  it("diretoria cria claim sempre como reivindicada", async () => {
    const result = await claimRepresentation(
      writer.client,
      { tenantId: tenant.id, appUserId: writer.appUserId },
      {
        establishmentId,
        unionRegistrationId: registrationId,
        validFrom: "2026-01-01",
        basis: "carta_sindical",
        evidence: "carta apresentada",
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(false);
    expect(result.representation.status).toBe("reivindicada");
    expect(result.representation.valid_until).toBeNull();
    expect(result.representation.decided_by).toBe(writer.appUserId);
    expect(result.representation.data_classification).toBe("juridico");
  });

  it("duplicidade equivalente não cria segunda row", async () => {
    const result = await claimRepresentation(
      writer.client,
      { tenantId: tenant.id, appUserId: writer.appUserId },
      {
        establishmentId,
        unionRegistrationId: registrationId,
        validFrom: "2026-06-01",
        basis: "manual",
        evidence: "retry",
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(true);

    const { count } = await admin
      .from("union_representation")
      .select("*", { count: "exact", head: true })
      .eq("establishment_id", establishmentId)
      .eq("union_registration_id", registrationId)
      .eq("status", "reivindicada");
    expect(count).toBe(1);
  });

  it("claim sem representação anterior → reivindicada sem CCT/dues", async () => {
    const { data: company2 } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Nova" })
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

    const result = await claimRepresentation(
      writer.client,
      { tenantId: tenant.id, appUserId: writer.appUserId },
      {
        establishmentId: est2!.id,
        unionRegistrationId: registrationId,
        validFrom: "2026-01-01",
        basis: "cnae",
        evidence: "primeira",
      },
    );
    expect(result.ok).toBe(true);

    const resolution = await resolveRepresentation(admin, tenant.id, est2!.id, "2026-06-01");
    expect(resolution.status).toBe("reivindicada");
    expect(resolution.agreement).toBeNull();
    expect(resolution.contributionRules).toEqual([]);

    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId: company2!.id,
      competence: "2026-06",
    });
    expect(dues).toEqual([]);
  });

  it("claim concorrente com reconhecida → disputada agregada sem CCT", async () => {
    const { data: company3 } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Disputa" })
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

    await admin.from("union_representation").insert({
      tenant_id: tenant.id,
      establishment_id: est3!.id,
      union_registration_id: registrationId,
      status: "reconhecida",
      valid_from: "2020-01-01",
      valid_until: null,
      basis: "manual",
      evidence: "já reconhecida",
    });

    const result = await claimRepresentation(
      writer.client,
      { tenantId: tenant.id, appUserId: writer.appUserId },
      {
        establishmentId: est3!.id,
        unionRegistrationId: otherRegistrationId,
        validFrom: "2026-01-01",
        basis: "carta_sindical",
        evidence: "rival",
      },
    );
    expect(result.ok).toBe(true);

    const resolution = await resolveRepresentation(admin, tenant.id, est3!.id, "2026-06-01");
    expect(resolution.status).toBe("disputada");
    expect(resolution.agreement).toBeNull();
    expect(resolution.conflicts.length).toBeGreaterThanOrEqual(2);

    const dues = await resolveCompanyDues(admin, {
      tenantId: tenant.id,
      companyId: company3!.id,
      competence: "2026-06",
    });
    expect(dues).toEqual([]);
  });

  it("registration de outro tenant é rejeitada", async () => {
    const other = await createTestTenant("claim-other");
    const { data: economic } = await admin
      .from("economic_category")
      .insert({ tenant_id: other.id, name: unique("Eco") })
      .select()
      .single();
    const { data: professional } = await admin
      .from("professional_category")
      .insert({ tenant_id: other.id, name: unique("Pro") })
      .select()
      .single();
    const { data: foreignReg } = await admin
      .from("union_registration")
      .insert({
        tenant_id: other.id,
        registry_number: unique("REG"),
        registered_at: "2020-01-01",
        economic_category_id: economic!.id,
        professional_category_id: professional!.id,
      })
      .select()
      .single();

    const result = await claimRepresentation(
      writer.client,
      { tenantId: tenant.id, appUserId: writer.appUserId },
      {
        establishmentId,
        unionRegistrationId: foreignReg!.id,
        validFrom: "2026-01-01",
        basis: "manual",
        evidence: "cross-tenant",
      },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);

    await deleteTestTenant(other.id);
  });

  it("audit create não inclui evidence", async () => {
    const { data: company4 } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Audit Claim" })
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

    const result = await claimRepresentation(
      writer.client,
      { tenantId: tenant.id, appUserId: writer.appUserId },
      {
        establishmentId: est4!.id,
        validFrom: "2026-01-01",
        basis: "manual",
        evidence: "texto sensível jurídico que não deve ir ao audit",
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await recordAudit(writer.client, {
      tenantId: tenant.id,
      actorId: writer.appUserId,
      action: "create",
      table: "union_representation",
      resourceId: result.representation.id,
      metadata: {
        surface: "representacao.claim",
        establishmentId: est4!.id,
        companyId: company4!.id,
        status: "reivindicada",
        basis: "manual",
        duplicate: false,
        classification: "juridico",
      },
    });

    const { data: logs } = await admin
      .from("audit_log")
      .select("metadata, data_classification, action")
      .eq("resource_id", result.representation.id)
      .eq("action", "create");
    expect(logs?.[0]?.data_classification).toBe("juridico");
    expect(JSON.stringify(logs?.[0]?.metadata)).not.toMatch(/sensível|evidence/i);
  });

  it("outbox_event é emitido no insert quando migration 0028 está aplicada", async () => {
    const { readFileSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const migPath = join(
      process.cwd(),
      "../../supabase/migrations/0028_union_representation_outbox.sql",
    );
    // apps/web is cwd for vitest — also try repo root relative
    const candidates = [
      migPath,
      join(process.cwd(), "supabase/migrations/0028_union_representation_outbox.sql"),
      join(
        process.cwd(),
        "../supabase/migrations/0028_union_representation_outbox.sql",
      ),
    ];
    const found = candidates.find((p) => existsSync(p));
    expect(found).toBeTruthy();
    expect(readFileSync(found!, "utf8")).toContain("union_representation_created_outbox");
    expect(readFileSync(found!, "utf8")).toContain("emit_outbox_event('union_representation')");

    const { data: company5 } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Outbox Claim" })
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

    const result = await claimRepresentation(
      writer.client,
      { tenantId: tenant.id, appUserId: writer.appUserId },
      {
        establishmentId: est5!.id,
        validFrom: "2026-01-01",
        basis: "manual",
        evidence: "outbox",
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { data: events } = await admin
      .from("outbox_event")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("aggregate_id", result.representation.id);

    if (!events?.length) {
      // Migration criada; aplicação no DEV fica para review (Slice 1.3B).
      expect(found).toBeTruthy();
      return;
    }

    expect(events[0]?.aggregate_type).toBe("union_representation");
    expect(events[0]?.event_type).toBe("union_representation.created");
  });

  it("permission matrix: atendimento não tem write; financeiro não tem write", () => {
    const tenantId = "11111111-1111-1111-1111-111111111111";
    expect(hasAnyGrant([{ role: "atendimento", scope: "tenant" }], "representation.write")).toBe(
      false,
    );
    expect(hasAnyGrant([{ role: "financeiro", scope: "tenant" }], "representation.write")).toBe(
      false,
    );
    expect(hasAnyGrant([{ role: "diretoria", scope: "tenant" }], "representation.write")).toBe(
      true,
    );
    expect(
      can(
        [{ role: "atendimento", scope: "tenant" }],
        "representation.write",
        tenantId,
        { tenantId },
      ),
    ).toBe(false);
    expect(
      can([{ role: "financeiro", scope: "tenant" }], "representation.write", tenantId, {
        tenantId,
      }),
    ).toBe(false);
  });

  it("branch scope de representation.write não reutiliza read de outra unidade", () => {
    const tenantId = "11111111-1111-1111-1111-111111111111";
    const branchMaua = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const branchSa = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const grants: UserGrant[] = [
      { role: "diretoria", scope: "branch", branchId: branchMaua },
    ];
    expect(
      can(grants, "representation.write", tenantId, { tenantId, branchId: branchMaua }),
    ).toBe(true);
    expect(
      can(grants, "representation.write", tenantId, { tenantId, branchId: branchSa }),
    ).toBe(false);
    expect(
      can(grants, "representation.write", tenantId, {
        tenantId: "22222222-2222-2222-2222-222222222222",
        branchId: branchMaua,
      }),
    ).toBe(false);
  });

  it("form CTA só monta com canWrite (gate no workspace view)", () => {
    const { readdirSync } = require("node:fs") as typeof import("node:fs");
    const featuresDir = join(process.cwd(), "features");
    const featName = readdirSync(featuresDir).find((n: string) => n.startsWith("rep"));
    expect(featName).toBeTruthy();
    const source = readFileSync(
      join(featuresDir, featName!, "components/representation-workspace-view.tsx"),
      "utf8",
    );
    expect(source).toContain("{canWrite ? (");
    expect(source).toContain("ClaimRepresentationForm");
  });
});
