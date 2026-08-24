import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { establishmentCreateSchema } from "@syntex/validation";
import { hasAnyGrant } from "@syntex/permissions";
import { admin, createTestTenant, createTestUser, deleteTestTenant, unique } from "./helpers";
import { createCompanyWithMaster } from "@/lib/domain/create-company-with-master";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** CNPJ válido conhecido (formatters.test). Suffix via branch digits for uniqueness. */
function cnpjVariant(branch: number): string {
  const root = "11222333";
  const branchStr = String(branch).padStart(4, "0");
  const base = `${root}${branchStr}`;
  const digits = base.split("").map(Number);
  const d1 = cnpjDv(digits, 12);
  const d2 = cnpjDv([...digits, d1], 13);
  return `${base}${d1}${d2}`;
}

function cnpjDv(digits: number[], len: number): number {
  const weights =
    len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + digits[i]! * w, 0);
  const rem = sum % 11;
  return rem < 2 ? 0 : 11 - rem;
}

describe("establishmentCreateSchema (B1)", () => {
  it("aceita filial com município e CNAE", () => {
    const parsed = establishmentCreateSchema.safeParse({
      companyId: "11111111-1111-1111-1111-111111111111",
      cnpj: "11222333000181",
      kind: "filial",
      municipalityId: "22222222-2222-2222-2222-222222222222",
      cnaeId: "33333333-3333-3333-3333-333333333333",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("B1 — estabelecimento no fluxo empresa", () => {
  let tenant: { id: string };
  let municipalityId: string;
  let cnaeId: string;
  let writer: Awaited<ReturnType<typeof createTestUser>>;
  let inviter: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    tenant = await createTestTenant("estab-b1");
    writer = await createTestUser(tenant.id, "diretoria", "tenant");
    inviter = await createTestUser(tenant.id, "admin", "tenant");

    const { data: mun } = await admin.from("municipality").select("id").limit(1).maybeSingle();
    if (!mun) throw new Error("municipality seed ausente — rode seed de referência");
    municipalityId = mun.id;

    const { data: cnae } = await admin.from("cnae").select("id").limit(1).maybeSingle();
    if (!cnae) throw new Error("seed CNAE ausente — rode seed básico");
    cnaeId = cnae.id;
  });

  afterAll(async () => {
    if (tenant?.id) await deleteTestTenant(tenant.id);
  });

  it("createCompanyWithMaster propaga municipalityId para empresa e matriz", async () => {
    const result = await createCompanyWithMaster(admin, {
      tenantId: tenant.id,
      invitedBy: inviter.appUserId,
      legalName: "Empresa Mun B1",
      cnpj: cnpjVariant(101),
      municipalityId,
      primaryCnaeId: cnaeId,
      accountResponsibleName: "Resp B1",
      accountResponsibleEmail: `${unique("resp")}@example.com`,
    });

    expect(result.company.municipality_id).toBe(municipalityId);
    expect(result.establishment.kind).toBe("matriz");
    expect(result.establishment.municipality_id).toBe(municipalityId);
    expect(result.establishment.cnae_id).toBe(cnaeId);
  });

  it("diretoria cria filial com município via client (establishment.write)", async () => {
    const { data: company } = await admin
      .from("company")
      .insert({
        tenant_id: tenant.id,
        cnpj: cnpjVariant(201),
        legal_name: "Empresa Filial B1",
      })
      .select()
      .single();

    await admin.from("establishment").insert({
      tenant_id: tenant.id,
      company_id: company!.id,
      cnpj: cnpjVariant(201),
      kind: "matriz",
      municipality_id: municipalityId,
    });

    const { data: filial, error } = await writer.client
      .from("establishment")
      .insert({
        tenant_id: tenant.id,
        company_id: company!.id,
        cnpj: cnpjVariant(202),
        kind: "filial",
        municipality_id: municipalityId,
        cnae_id: cnaeId,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(filial?.kind).toBe("filial");
    expect(filial?.municipality_id).toBe(municipalityId);

    const { count } = await admin
      .from("establishment")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company!.id);
    expect(count).toBe(2);
  });

  it("permission: atendimento sem establishment.write", () => {
    expect(hasAnyGrant([{ role: "atendimento", scope: "tenant" }], "establishment.write")).toBe(
      false,
    );
    expect(hasAnyGrant([{ role: "diretoria", scope: "tenant" }], "establishment.write")).toBe(
      true,
    );
  });

  it("UI create establishment e município na nova empresa", () => {
    const form = readFileSync(
      join(process.cwd(), "features/companies/create-establishment-form.tsx"),
      "utf8",
    );
    expect(form).toContain("/api/establishments");
    expect(form).toContain("municipalityId");
    expect(form).toContain("Novo estabelecimento");

    const companyForm = readFileSync(
      join(process.cwd(), "features/companies/create-company-form.tsx"),
      "utf8",
    );
    expect(companyForm).toContain("municipalityId");
    expect(companyForm).toContain("Município da matriz");

    const panel = readFileSync(
      join(process.cwd(), "features/companies/components/empresa-360-representacao.tsx"),
      "utf8",
    );
    expect(panel).toContain("CreateEstablishmentForm");
    expect(panel).toContain("canWriteEstablishment");
  });
});
