import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { resolveAgreement } from "@/lib/domain/resolve-agreement";

describe("resolução de CCT (território + categorias + data)", () => {
  let tenant: { id: string };
  let economicId: string;
  let professionalId: string;
  let municipalityIn: string;
  let municipalityOut: string;
  let agreementRestrictedId: string;
  let agreementOpenId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("agreement");

    const { data: municipalities, error: munError } = await admin
      .from("municipality")
      .select("id, name")
      .in("name", ["Santo André", "Mauá"])
      .limit(2);
    if (munError) throw munError;
    if (!municipalities || municipalities.length < 2) {
      throw new Error("seed de referência precisa de Santo André e Mauá");
    }
    municipalityIn = municipalities.find((m) => m.name === "Santo André")!.id;
    municipalityOut = municipalities.find((m) => m.name === "Mauá")!.id;

    const { data: economic, error: ecoError } = await admin
      .from("economic_category")
      .insert({ tenant_id: tenant.id, name: unique("Eco") })
      .select()
      .single();
    if (ecoError) throw ecoError;
    economicId = economic.id;

    const { data: professional, error: proError } = await admin
      .from("professional_category")
      .insert({ tenant_id: tenant.id, name: unique("Pro") })
      .select()
      .single();
    if (proError) throw proError;
    professionalId = professional.id;

    // Duas CCTs em períodos diferentes: uma aberta (sem território), uma restrita a Santo André.
    // EXCLUDE impede sobreposição no mesmo par de categorias — usamos vigências distintas.
    const { data: open, error: openError } = await admin
      .from("collective_agreement")
      .insert({
        tenant_id: tenant.id,
        kind: "cct",
        mediador_number: "OPEN-2024",
        valid_from: "2024-01-01",
        valid_until: "2024-12-31",
        base_date: "2024-01-01",
        economic_category_id: economicId,
        professional_category_id: professionalId,
      })
      .select()
      .single();
    if (openError) throw openError;
    agreementOpenId = open.id;

    const { data: restricted, error: restrictedError } = await admin
      .from("collective_agreement")
      .insert({
        tenant_id: tenant.id,
        kind: "cct",
        mediador_number: "REST-2025",
        valid_from: "2025-01-01",
        valid_until: "2025-12-31",
        base_date: "2025-01-01",
        economic_category_id: economicId,
        professional_category_id: professionalId,
      })
      .select()
      .single();
    if (restrictedError) throw restrictedError;
    agreementRestrictedId = restricted.id;

    const { error: terrError } = await admin.from("collective_agreement_territory").insert({
      tenant_id: tenant.id,
      collective_agreement_id: agreementRestrictedId,
      municipality_id: municipalityIn,
    });
    if (terrError) throw terrError;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("CCT sem território casa em qualquer município", async () => {
    const result = await resolveAgreement(admin, {
      tenantId: tenant.id,
      economicCategoryId: economicId,
      professionalCategoryId: professionalId,
      referenceDate: "2024-06-15",
      municipalityId: municipalityOut,
    });
    expect(result?.id).toBe(agreementOpenId);
  });

  it("CCT com território casa só no município listado", async () => {
    const inside = await resolveAgreement(admin, {
      tenantId: tenant.id,
      economicCategoryId: economicId,
      professionalCategoryId: professionalId,
      referenceDate: "2025-06-15",
      municipalityId: municipalityIn,
    });
    expect(inside?.id).toBe(agreementRestrictedId);

    const outside = await resolveAgreement(admin, {
      tenantId: tenant.id,
      economicCategoryId: economicId,
      professionalCategoryId: professionalId,
      referenceDate: "2025-06-15",
      municipalityId: municipalityOut,
    });
    expect(outside).toBeNull();
  });

  it("estabelecimento sem município não casa com CCT territorializada", async () => {
    const result = await resolveAgreement(admin, {
      tenantId: tenant.id,
      economicCategoryId: economicId,
      professionalCategoryId: professionalId,
      referenceDate: "2025-06-15",
      municipalityId: null,
    });
    expect(result).toBeNull();
  });
});
