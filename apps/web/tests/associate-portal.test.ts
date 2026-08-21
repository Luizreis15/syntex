import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isAssociatePortalActor, can, type UserGrant } from "@syntex/permissions";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { createWorkerWithPerson } from "@/lib/domain/worker";
import { issueAssociateAccess } from "@/lib/domain/associate-access";
import { acceptStaffInvite } from "@/lib/domain/staff-invite";

describe("portal associado — permissões", () => {
  const TENANT = "11111111-1111-1111-1111-111111111111";
  const USER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  it("associate com escopo own lê filiação própria", () => {
    const grants: UserGrant[] = [{ role: "associate", scope: "own" }];
    expect(isAssociatePortalActor(grants)).toBe(true);
    expect(
      can(grants, "membership.read", TENANT, { tenantId: TENANT, ownerId: USER }, USER),
    ).toBe(true);
    expect(
      can(grants, "membership.read", TENANT, { tenantId: TENANT, ownerId: "other" }, USER),
    ).toBe(false);
    expect(can(grants, "finance.write", TENANT, { tenantId: TENANT, ownerId: USER }, USER)).toBe(
      false,
    );
  });
});

describe("emitir e aceitar acesso associado", () => {
  let tenant: { id: string };
  let inviterId: string;
  let personId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("assoc9");
    const email = `${unique("inv")}@example.com`;
    const { data: auth, error: authError } = await admin.auth.admin.createUser({
      email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (authError || !auth.user) throw authError ?? new Error("auth");
    const { data: inviter } = await admin
      .from("app_user")
      .insert({
        tenant_id: tenant.id,
        auth_user_id: auth.user.id,
        full_name: "Atendente",
        email,
      })
      .select()
      .single();
    inviterId = inviter!.id;

    const created = await createWorkerWithPerson(admin, tenant.id, {
      cpf: unique("1").replace(/\D/g, "").padEnd(11, "0").slice(0, 11),
      fullName: "Associado Teste",
      email: `${unique("assoc")}@example.com`,
      membershipStatus: "ativo",
      membershipValidFrom: "2026-01-01",
    });
    personId = created.person.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("issueAssociateAccess + accept liga person.app_user_id", async () => {
    const { inviteToken, email } = await issueAssociateAccess(admin, {
      tenantId: tenant.id,
      personId,
      invitedBy: inviterId,
    });

    const { data: auth, error } = await admin.auth.admin.createUser({
      email,
      password: "test-password-123!",
      email_confirm: true,
    });
    if (error || !auth.user) throw error ?? new Error("auth");

    const accepted = await acceptStaffInvite(admin, {
      token: inviteToken,
      authUserId: auth.user.id,
      fullName: "Associado Teste",
    });

    const { data: person } = await admin
      .from("person")
      .select("app_user_id")
      .eq("id", personId)
      .single();
    expect(person?.app_user_id).toBe(accepted.appUserId);

    const { data: ur } = await admin
      .from("user_role")
      .select("scope, role:user_role_role_id_tenant_id_fkey(name)")
      .eq("app_user_id", accepted.appUserId)
      .single();
    expect(ur?.scope).toBe("own");
    expect((ur?.role as unknown as { name: string }).name).toBe("associate");
  });
});
