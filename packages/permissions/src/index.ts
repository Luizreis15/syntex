import type { Scope } from "@syntex/types";

export const PERMISSIONS = [
  "company.read",
  "company.write",
  "establishment.read",
  "establishment.write",
  "representation.read",
  "representation.write",
  "representation.decide",
  "agreement.read",
  "agreement.write",
  "contribution_rule.read",
  "contribution_rule.write",
  "finance.read",
  "finance.write",
  "finance.pay",
  "worker.read",
  "worker.write",
  "membership.read",
  "membership.write",
  "staff.read",
  "staff.invite",
  "platform.tenant.read",
  "platform.tenant.provision",
  "company.master.provision",
  "company.user.invite",
  "associate.access.issue",
  "office.provision",
  "office.company.link",
  "office.user.invite",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

/** Roles de tenant. platform_admin vive fora (tabela platform_admin). */
export type RoleName =
  | "admin"
  | "diretoria"
  | "atendimento"
  | "financeiro"
  | "company_master"
  | "company_user"
  | "associate"
  | "office_master"
  | "office_user";

const COMPANY_PORTAL_PERMS = [
  "company.read",
  "establishment.read",
  "finance.read",
  "finance.pay",
  "worker.read",
  "membership.read",
] as const satisfies readonly PermissionKey[];

const ASSOCIATE_PORTAL_PERMS = [
  "worker.read",
  "membership.read",
  "finance.read",
  "company.read",
] as const satisfies readonly PermissionKey[];

const OFFICE_PORTAL_PERMS = [
  ...COMPANY_PORTAL_PERMS,
  "office.company.link",
] as const satisfies readonly PermissionKey[];

export const ROLE_PERMISSIONS: Record<RoleName, readonly PermissionKey[]> = {
  admin: PERMISSIONS.filter((p) => !p.startsWith("platform.")),
  diretoria: [
    "company.read",
    "company.write",
    "establishment.read",
    "establishment.write",
    "representation.read",
    "representation.write",
    "representation.decide",
    "agreement.read",
    "agreement.write",
    "contribution_rule.read",
    "contribution_rule.write",
    "finance.read",
    "worker.read",
    "worker.write",
    "membership.read",
    "membership.write",
    "staff.read",
    "staff.invite",
    "company.master.provision",
    "associate.access.issue",
    "office.provision",
    "office.company.link",
    "office.user.invite",
  ],
  atendimento: [
    "company.read",
    "establishment.read",
    "representation.read",
    "agreement.read",
    "worker.read",
    "worker.write",
    "membership.read",
    "membership.write",
    "associate.access.issue",
  ],
  financeiro: [
    "finance.read",
    "finance.write",
    "finance.pay",
    "contribution_rule.read",
    "contribution_rule.write",
    "agreement.read",
    "company.read",
    "worker.read",
    "membership.read",
  ],
  company_master: [...COMPANY_PORTAL_PERMS, "company.user.invite"],
  company_user: COMPANY_PORTAL_PERMS,
  /** Portal associado — só dados próprios (escopo own). */
  associate: ASSOCIATE_PORTAL_PERMS,
  /** Escritório: opera N empresas via delegações (grants company sintéticos na sessão). */
  office_master: [...OFFICE_PORTAL_PERMS, "office.user.invite"],
  office_user: COMPANY_PORTAL_PERMS,
};

export interface UserGrant {
  role: RoleName;
  scope: Scope;
  branchId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
  officeId?: string | null;
}

export interface ResourceContext {
  tenantId: string;
  branchId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
  officeId?: string | null;
  ownerId?: string | null;
}

function scopeAllows(grant: UserGrant, resource: ResourceContext, userId?: string): boolean {
  switch (grant.scope) {
    case "global":
    case "tenant":
      return true;
    case "branch":
      return grant.branchId != null && resource.branchId != null && grant.branchId === resource.branchId;
    case "department":
      return (
        grant.departmentId != null &&
        resource.departmentId != null &&
        grant.departmentId === resource.departmentId
      );
    case "company":
      return (
        grant.companyId != null && resource.companyId != null && grant.companyId === resource.companyId
      );
    case "office":
      return grant.officeId != null && resource.officeId != null && grant.officeId === resource.officeId;
    case "own":
      return userId != null && resource.ownerId != null && userId === resource.ownerId;
    default:
      return false;
  }
}

export function can(
  grants: UserGrant[],
  permission: PermissionKey,
  userTenantId: string,
  resource: ResourceContext,
  userId?: string,
): boolean {
  if (userTenantId !== resource.tenantId) return false;
  return grants.some(
    (grant) => ROLE_PERMISSIONS[grant.role]?.includes(permission) && scopeAllows(grant, resource, userId),
  );
}

export function hasAnyGrant(grants: UserGrant[], permission: PermissionKey): boolean {
  return grants.some((grant) => ROLE_PERMISSIONS[grant.role]?.includes(permission));
}

/** True se o usuário só opera no portal empresa (não escritório). */
export function isCompanyPortalActor(grants: UserGrant[]): boolean {
  if (grants.length === 0) return false;
  if (grants.some((g) => g.role === "office_master" || g.role === "office_user")) return false;
  return grants.every(
    (g) =>
      g.scope === "company" &&
      g.companyId != null &&
      (g.role === "company_master" || g.role === "company_user"),
  );
}

/** True se o usuário opera no portal do escritório. */
export function isOfficePortalActor(grants: UserGrant[]): boolean {
  if (grants.length === 0) return false;
  return grants.some((g) => g.role === "office_master" || g.role === "office_user");
}

/** True se o usuário só opera no portal associado. */
export function isAssociatePortalActor(grants: UserGrant[]): boolean {
  if (grants.length === 0) return false;
  return grants.every((g) => g.role === "associate" && g.scope === "own");
}

export function primaryCompanyId(grants: UserGrant[]): string | null {
  const id = grants.find((g) => g.scope === "company" && g.companyId)?.companyId;
  return id ?? null;
}

export function primaryOfficeId(grants: UserGrant[]): string | null {
  const id = grants.find(
    (g) =>
      (g.role === "office_master" || g.role === "office_user") &&
      g.scope === "office" &&
      g.officeId,
  )?.officeId;
  return id ?? null;
}

export function allowedBranchIds(grants: UserGrant[], permission: PermissionKey): "all" | string[] {
  const relevant = grants.filter((grant) => ROLE_PERMISSIONS[grant.role]?.includes(permission));
  if (relevant.some((grant) => grant.scope === "tenant" || grant.scope === "global")) return "all";
  const branchIds = relevant
    .filter((grant) => grant.scope === "branch" && grant.branchId != null)
    .map((grant) => grant.branchId!);
  return Array.from(new Set(branchIds));
}

export function allowedCompanyIds(grants: UserGrant[], permission: PermissionKey): "all" | string[] {
  const relevant = grants.filter((grant) => ROLE_PERMISSIONS[grant.role]?.includes(permission));
  if (
    relevant.some(
      (grant) =>
        grant.scope === "tenant" ||
        grant.scope === "global" ||
        grant.scope === "branch" ||
        grant.scope === "department",
    )
  ) {
    return "all";
  }
  const companyIds = relevant
    .filter((grant) => grant.scope === "company" && grant.companyId != null)
    .map((grant) => grant.companyId!);
  return Array.from(new Set(companyIds));
}
