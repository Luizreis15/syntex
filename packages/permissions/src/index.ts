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
  // Ilustrativo: prova que o motor de permissão não depende do domínio de
  // finanças existir para negar/conceder corretamente (ver DoD de permissão).
  "finance.read",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export type RoleName = "admin" | "diretoria" | "atendimento" | "financeiro";

export const ROLE_PERMISSIONS: Record<RoleName, readonly PermissionKey[]> = {
  admin: PERMISSIONS,
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
  ],
  atendimento: ["company.read", "establishment.read", "representation.read", "agreement.read"],
  financeiro: ["finance.read", "contribution_rule.read", "agreement.read"],
};

export interface UserGrant {
  role: RoleName;
  scope: Scope;
  branchId?: string | null;
}

export interface ResourceContext {
  tenantId: string;
  branchId?: string | null;
  departmentId?: string | null;
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
      // department/team/staff ainda não existem neste corte — escopo nunca satisfeito
      return false;
    case "own":
      return userId != null && resource.ownerId != null && userId === resource.ownerId;
    default:
      return false;
  }
}

/**
 * Autorização em app-layer: role -> permission -> scope.
 * RLS garante isolamento de tenant no banco; esta função é a segunda
 * verificação (rica, tipada, testável) que decide o que o usuário pode ver
 * dentro do próprio tenant.
 *
 * Exige um `resource` concreto — é isto que a distingue de `hasAnyGrant` e
 * `allowedBranchIds` abaixo. Chamar `can()` com um resource incompleto (ex.:
 * sem `branchId` para checar um grant de escopo `branch`) não é "checagem
 * mais ampla", é bug: `scopeAllows` nega por falta de dado, não por falta de
 * permissão — um usuário só-de-uma-unidade ficaria bloqueado até de listar.
 */
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

/**
 * Checagem de portão para listagem: "este usuário tem esta permissão em
 * algum escopo?", sem ainda saber o recurso concreto. Use antes de montar a
 * query de uma lista — a restrição real por linha vem de `allowedBranchIds`
 * ou de filtrar cada linha com `can()` depois de buscá-la.
 */
export function hasAnyGrant(grants: UserGrant[], permission: PermissionKey): boolean {
  return grants.some((grant) => ROLE_PERMISSIONS[grant.role]?.includes(permission));
}

/**
 * Para montar o filtro de uma listagem: `"all"` quando algum grant cobre o
 * tenant inteiro (ou é `global`); senão, a lista de `branchId`s cobertos por
 * grants de escopo `branch` (pode ser vazia = sem acesso nenhum). Escopos
 * `own`/`department` não entram aqui — são outra dimensão de filtro.
 */
export function allowedBranchIds(grants: UserGrant[], permission: PermissionKey): "all" | string[] {
  const relevant = grants.filter((grant) => ROLE_PERMISSIONS[grant.role]?.includes(permission));
  if (relevant.some((grant) => grant.scope === "tenant" || grant.scope === "global")) return "all";
  const branchIds = relevant
    .filter((grant) => grant.scope === "branch" && grant.branchId != null)
    .map((grant) => grant.branchId!);
  return Array.from(new Set(branchIds));
}
