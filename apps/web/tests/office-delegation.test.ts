import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  can,
  isCompanyPortalActor,
  isOfficePortalActor,
  allowedCompanyIds,
  type UserGrant,
} from "@syntex/permissions";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import {
  acceptStaffInvite,
  createStaffInvite,
} from "@/lib/domain/staff-invite";
import {
  createOfficeWithMaster,
  linkOfficeCompany,
  listActiveCompanyDelegations,
} from "@/lib/domain/office";

describe("escritório — permissões", () => {
  const TENANT = "11111111-1111-1111-1111-111111111111";
  const OFFICE = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const COMPANY = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  it("office_master não é company portal; opera N empresas via grants company", () => {
    const grants: UserGrant[] = [
      { role: "office_master", scope: "office", officeId: OFFICE },
      { role: "office_master", scope: "company", companyId: COMPANY, officeId: OFFICE },
    ];
    expect(isOfficePortalActor(grants)).toBe(true);
    expect(isCompanyPortalActor(grants)).toBe(false);
    expect(can(grants, "finance.pay", TENANT, { tenantId: TENANT, companyId: COMPANY })).toBe(true);
    expect(can(grants, "finance.pay", TENANT, { tenantId: TENANT, companyId: "other" })).toBe(false);
    expect(allowedCompanyIds(grants, "finance.read")).toEqual([COMPANY]);
  });
});

describe("escritório — provision + link + delegação", () => {
  let tenant: { id: string };
  let companyA: string;
  let companyB: string;
  let staffId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("office10");

    const { data: a } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa A Office" })
      .select()
      .single();
    companyA = a!.id;

    const { data: b } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa B Office" })
      .select()
      .single();
    companyB = b!.id;

    const email = `${unique("st")}@example.com`;
    const { data: auth, error } = await admin.auth.admin.createUser({
      email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (error || !auth.user) throw error ?? new Error("auth");
    const { data: staff } = await admin
      .from("app_user")
      .insert({
        tenant_id: tenant.id,
        auth_user_id: auth.user.id,
        full_name: "Staff",
        email,
      })
      .select()
      .single();
    staffId = staff!.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("cria office, aceita master, vincula 2 empresas → 2 delegações", async () => {
    const masterEmail = `${unique("om")}@example.com`;
    const { office, inviteToken } = await createOfficeWithMaster(admin, {
      tenantId: tenant.id,
      name: `Escritório ${unique("e")}`,
      masterEmail,
      masterFullName: "Master Contábil",
      createdBy: staffId,
    });

    const { data: auth, error } = await admin.auth.admin.createUser({
      email: masterEmail,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (error || !auth.user) throw error ?? new Error("auth master");

    const accepted = await acceptStaffInvite(admin, {
      token: inviteToken,
      authUserId: auth.user.id,
      fullName: "Master Contábil",
    });

    await linkOfficeCompany(admin, {
      tenantId: tenant.id,
      officeId: office.id,
      companyId: companyA,
      reason: "contrato contábil A",
      linkedBy: staffId,
    });
    await linkOfficeCompany(admin, {
      tenantId: tenant.id,
      officeId: office.id,
      companyId: companyB,
      reason: "contrato contábil B",
      linkedBy: staffId,
    });

    const dels = await listActiveCompanyDelegations(admin, tenant.id, accepted.appUserId);
    const companyIds = dels.map((d) => d.companyId).sort();
    expect(companyIds).toEqual([companyA, companyB].sort());
    expect(dels.every((d) => d.officeId === office.id)).toBe(true);
  });

  it("novo office_user herda delegações das empresas já linkadas", async () => {
    const { data: offices } = await admin
      .from("office")
      .select("id")
      .eq("tenant_id", tenant.id)
      .limit(1);
    const officeId = offices![0]!.id;

    const email = `${unique("ou")}@example.com`;
    const { invite, token } = await createStaffInvite(admin, {
      tenantId: tenant.id,
      email,
      roleName: "office_user",
      scope: "office",
      officeId,
      invitedBy: staffId,
    });
    expect(invite.office_id).toBe(officeId);

    const { data: auth, error } = await admin.auth.admin.createUser({
      email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (error || !auth.user) throw error ?? new Error("auth user");

    const accepted = await acceptStaffInvite(admin, {
      token,
      authUserId: auth.user.id,
      fullName: "Operador",
    });

    const dels = await listActiveCompanyDelegations(admin, tenant.id, accepted.appUserId);
    expect(dels.length).toBeGreaterThanOrEqual(2);
  });
});
