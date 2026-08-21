import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { allowedCompanyIds, can, type UserGrant } from "@syntex/permissions";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { provisionTenantWithMaster } from "@/lib/domain/provision-tenant";
import { createCompanyWithMaster } from "@/lib/domain/create-company-with-master";
import { acceptStaffInvite } from "@/lib/domain/staff-invite";

describe("permissions — escopo company", () => {
  const TENANT = "11111111-1111-1111-1111-111111111111";
  const COMPANY_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const COMPANY_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  it("company_master só acessa a própria empresa", () => {
    const grants: UserGrant[] = [
      { role: "company_master", scope: "company", companyId: COMPANY_A },
    ];
    expect(
      can(grants, "company.read", TENANT, { tenantId: TENANT, companyId: COMPANY_A }),
    ).toBe(true);
    expect(
      can(grants, "company.read", TENANT, { tenantId: TENANT, companyId: COMPANY_B }),
    ).toBe(false);
    expect(allowedCompanyIds(grants, "company.read")).toEqual([COMPANY_A]);
  });

  it("admin tenant vê todas as empresas (allowedCompanyIds = all)", () => {
    const grants: UserGrant[] = [{ role: "admin", scope: "tenant" }];
    expect(allowedCompanyIds(grants, "company.read")).toBe("all");
    expect(can(grants, "company.master.provision", TENANT, { tenantId: TENANT })).toBe(true);
  });
});

describe("provisionamento platform + company master", () => {
  const createdTenantIds: string[] = [];
  let platformAdminId: string;
  let unionTenant: { id: string };
  let inviterId: string;

  beforeAll(async () => {
    const email = `${unique("plat")}@example.com`;
    const { data: auth, error: authError } = await admin.auth.admin.createUser({
      email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (authError) throw authError;

    const { data: pa, error: paError } = await admin
      .from("platform_admin")
      .insert({
        auth_user_id: auth.user.id,
        email,
        full_name: "Platform Test",
      })
      .select()
      .single();
    if (paError) throw paError;
    platformAdminId = pa.id;

    unionTenant = await createTestTenant("union7");
    const invEmail = `${unique("uadm")}@example.com`;
    const { data: invAuth, error: invAuthError } = await admin.auth.admin.createUser({
      email: invEmail,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (invAuthError) throw invAuthError;
    const { data: invUser, error: invUserError } = await admin
      .from("app_user")
      .insert({
        tenant_id: unionTenant.id,
        auth_user_id: invAuth.user.id,
        full_name: "Union Admin",
        email: invEmail,
      })
      .select()
      .single();
    if (invUserError) throw invUserError;
    inviterId = invUser.id;
  });

  afterAll(async () => {
    for (const id of createdTenantIds) {
      await deleteTestTenant(id);
    }
    await deleteTestTenant(unionTenant.id);
    await admin.from("platform_admin").delete().eq("id", platformAdminId);
  });

  it("provisionTenantWithMaster cria tenant, roles, branch e master com senha", async () => {
    const slug = unique("t").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20);
    const masterEmail = `${unique("master")}@example.com`;
    const result = await provisionTenantWithMaster({
      slug: slug || "t-prov",
      legalName: "Sindicato Teste L7",
      tradeName: "Sindi Teste",
      sector: "comércio",
      cnpj: `${Date.now()}`.padStart(14, "0").slice(-14),
      masterEmail,
      masterName: "Master Teste",
      masterPassword: "senha-teste-123",
      invitedByPlatformAdminId: platformAdminId,
    });
    createdTenantIds.push(result.tenant.id);

    expect(result.masterEmail).toBe(masterEmail);
    expect(result.tenant.sector).toBe("comércio");

    const { data: roles } = await admin
      .from("role")
      .select("name")
      .eq("tenant_id", result.tenant.id);
    expect(roles?.map((r) => r.name)).toContain("admin");
    expect(roles?.map((r) => r.name)).toContain("company_master");

    const { data: appUser } = await admin
      .from("app_user")
      .select("id, email")
      .eq("id", result.appUserId)
      .single();
    expect(appUser?.email).toBe(masterEmail);

    const { data: ur } = await admin
      .from("user_role")
      .select("scope")
      .eq("app_user_id", result.appUserId)
      .single();
    expect(ur?.scope).toBe("tenant");
  });

  it("createCompanyWithMaster + accept cria user_role com escopo company", async () => {
    const { company, inviteToken } = await createCompanyWithMaster(admin, {
      tenantId: unionTenant.id,
      legalName: "Empresa Master L7",
      cnpj: unique("00"),
      accountResponsibleName: "Responsável Teste",
      accountResponsibleEmail: `${unique("cm")}@example.com`,
      invitedBy: inviterId,
    });

    const { data: created, error } = await admin.auth.admin.createUser({
      email: `${unique("cmacc")}@example.com`,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (error) throw error;

    // accept usa o e-mail do convite no app_user — auth pode ter e-mail diferente;
    // alinhamos criando auth com o mesmo e-mail do convite
    await admin.auth.admin.deleteUser(created.user.id);

    const { data: inviteRow } = await admin
      .from("staff_invite")
      .select("email")
      .eq("company_id", company.id)
      .is("accepted_at", null)
      .single();

    const { data: masterAuth, error: masterAuthError } = await admin.auth.admin.createUser({
      email: inviteRow!.email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (masterAuthError) throw masterAuthError;

    const accepted = await acceptStaffInvite(admin, {
      token: inviteToken,
      authUserId: masterAuth.user.id,
      fullName: "Company Master",
    });

    const { data: ur } = await admin
      .from("user_role")
      .select("scope, company_id")
      .eq("app_user_id", accepted.appUserId)
      .single();
    expect(ur?.scope).toBe("company");
    expect(ur?.company_id).toBe(company.id);
  });
});
