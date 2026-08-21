import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  can,
  isCompanyPortalActor,
  primaryCompanyId,
  type UserGrant,
} from "@syntex/permissions";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";
import { createChargePaymentIntent } from "@/lib/domain/payment-intent";
import { inviteCompanyUser } from "@/lib/domain/invite-company-user";
import { acceptStaffInvite } from "@/lib/domain/staff-invite";
import {
  canPayOrWriteCharge,
  resolveChargeCompanyId,
} from "@/lib/domain/company-portal";

describe("portal empresa — permissões", () => {
  const TENANT = "11111111-1111-1111-1111-111111111111";
  const COMPANY = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  it("company_user / master têm finance.pay e são atores de portal", () => {
    const grants: UserGrant[] = [
      { role: "company_user", scope: "company", companyId: COMPANY },
    ];
    expect(isCompanyPortalActor(grants)).toBe(true);
    expect(primaryCompanyId(grants)).toBe(COMPANY);
    expect(can(grants, "finance.pay", TENANT, { tenantId: TENANT, companyId: COMPANY })).toBe(true);
    expect(can(grants, "finance.write", TENANT, { tenantId: TENANT, companyId: COMPANY })).toBe(
      false,
    );
    expect(canPayOrWriteCharge(grants, TENANT, COMPANY)).toBe(true);
  });

  it("company_master convida; company_user não", () => {
    const master: UserGrant[] = [
      { role: "company_master", scope: "company", companyId: COMPANY },
    ];
    const user: UserGrant[] = [{ role: "company_user", scope: "company", companyId: COMPANY }];
    expect(can(master, "company.user.invite", TENANT, { tenantId: TENANT, companyId: COMPANY })).toBe(
      true,
    );
    expect(can(user, "company.user.invite", TENANT, { tenantId: TENANT, companyId: COMPANY })).toBe(
      false,
    );
  });
});

describe("portal empresa — intent na cobrança da empresa", () => {
  let tenant: { id: string };
  let companyId: string;
  let otherCompanyId: string;
  let ruleId: string;
  let inviterId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("portal8");
    await admin.from("tenant").update({ default_charge_provider: "stub" }).eq("id", tenant.id);

    const { data: company } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Portal Co" })
      .select()
      .single();
    companyId = company!.id;

    const { data: other } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Outra Co" })
      .select()
      .single();
    otherCompanyId = other!.id;

    const email = `${unique("cm")}@example.com`;
    const { data: auth, error: authError } = await admin.auth.admin.createUser({
      email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (authError || !auth.user) throw authError ?? new Error("auth create failed");
    const { data: appUser } = await admin
      .from("app_user")
      .insert({
        tenant_id: tenant.id,
        auth_user_id: auth.user.id,
        full_name: "Master",
        email,
      })
      .select()
      .single();
    inviterId = appUser!.id;

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
    const { data: agreement } = await admin
      .from("collective_agreement")
      .insert({
        tenant_id: tenant.id,
        kind: "cct",
        mediador_number: "MR-P8",
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        base_date: "2026-01-01",
        economic_category_id: economic!.id,
        professional_category_id: professional!.id,
      })
      .select()
      .single();
    const { data: rule } = await admin
      .from("contribution_rule")
      .insert({
        tenant_id: tenant.id,
        collective_agreement_id: agreement!.id,
        type: "mensalidade",
        valid_from: "2026-01-01",
        calculation_base: "empresa",
        value_type: "valor_fixo",
        value: 99,
      })
      .select()
      .single();
    ruleId = rule!.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("resolve company_id da charge e gera intent stub", async () => {
    const { charge } = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-08",
    });

    const resolved = await resolveChargeCompanyId(admin, tenant.id, charge.id);
    expect(resolved).toBe(companyId);
    expect(resolved).not.toBe(otherCompanyId);

    const { intent } = await createChargePaymentIntent(admin, {
      tenantId: tenant.id,
      chargeId: charge.id,
      billingType: "pix",
    });
    expect(intent.provider).toBe("stub");
    expect(intent.pixCopyPaste).toBeTruthy();
  });

  it("inviteCompanyUser cria convite company_user", async () => {
    const { invite, token } = await inviteCompanyUser(admin, {
      tenantId: tenant.id,
      companyId,
      email: `${unique("cu")}@example.com`,
      invitedBy: inviterId,
    });
    expect(invite.role_name).toBe("company_user");
    expect(invite.company_id).toBe(companyId);
    expect(token).toHaveLength(64);

    const { data: auth, error: authError } = await admin.auth.admin.createUser({
      email: invite.email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (authError || !auth.user) throw authError ?? new Error("auth create failed");
    const accepted = await acceptStaffInvite(admin, {
      token,
      authUserId: auth.user.id,
      fullName: "Operador",
    });
    const { data: ur } = await admin
      .from("user_role")
      .select("scope, company_id")
      .eq("app_user_id", accepted.appUserId)
      .single();
    expect(ur?.scope).toBe("company");
    expect(ur?.company_id).toBe(companyId);
  });
});
