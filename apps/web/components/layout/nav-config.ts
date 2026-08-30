import { can, type PermissionKey, type UserGrant } from "@syntex/permissions";
import { DASHBOARD_METRIC_PERMISSIONS } from "@/features/dashboard/data";

/**
 * Chave de ícone, não o componente — NAV_SECTIONS atravessa a fronteira
 * Server → Client (filterNavSections roda em shell.tsx, um Server
 * Component; Sidebar é client). React Server Components não serializa
 * função/componente em prop; o componente lucide real é resolvido em
 * sidebar.tsx via NAV_ICON.
 */
export type NavIconKey =
  | "layout-grid"
  | "users"
  | "building-2"
  | "scale"
  | "file-check-2"
  | "receipt-text"
  | "user-cog"
  | "briefcase";

/**
 * Navegação do painel do sindicato — **Core operacional** (ADR-022).
 * Emenda ADR-017: sem mapa fantasma (`built:false`) na chrome do Core.
 *
 * Só itens REAL do DoD V1 (`docs/SYNTEX-VERSIONS.md`). Novos módulos
 * entram quando `built: true` + rota + permission.
 *
 * `built: true` — some da UI se o usuário não tiver a permissão.
 * Autorização real continua em app-layer + RLS.
 */
export type NavItem =
  | { label: string; built: true; href: string; permission: PermissionKey; icon: NavIconKey }
  | {
      label: string;
      built: true;
      href: string;
      /** Qualquer uma basta (OR) — alinhado ao gate da página. */
      permissions: readonly PermissionKey[];
      icon: NavIconKey;
    };

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Visão geral",
    items: [
      {
        label: "Painel",
        built: true,
        href: "/painel",
        permissions: DASHBOARD_METRIC_PERMISSIONS,
        icon: "layout-grid",
      },
    ],
  },
  {
    label: "Relações",
    items: [
      { label: "Trabalhadores", built: true, href: "/trabalhadores", permission: "worker.read", icon: "users" },
      { label: "Empresas", built: true, href: "/empresas", permission: "company.read", icon: "building-2" },
      { label: "Representação", built: true, href: "/representacao", permission: "representation.read", icon: "scale" },
      { label: "Convenções", built: true, href: "/convencoes", permission: "agreement.read", icon: "file-check-2" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Cobranças", built: true, href: "/cobrancas", permission: "finance.read", icon: "receipt-text" },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Equipe", built: true, href: "/equipe", permission: "staff.read", icon: "user-cog" },
      { label: "Escritórios", built: true, href: "/escritorios", permission: "office.provision", icon: "briefcase" },
    ],
  },
];

export function isBuiltNavItemVisible(
  item: Extract<NavItem, { built: true }>,
  grants: UserGrant[],
  tenantId: string,
): boolean {
  const keys = "permissions" in item ? item.permissions : [item.permission];
  return keys.some((permission) => can(grants, permission, tenantId, { tenantId }));
}

export function filterNavSections(grants: UserGrant[], tenantId: string): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isBuiltNavItemVisible(item, grants, tenantId)),
  })).filter((section) => section.items.length > 0);
}
