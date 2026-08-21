import { can, type PermissionKey, type UserGrant } from "@syntex/permissions";

/**
 * Navegação só lista o que existe. Módulo sem permissão some (SYNTEX-UI).
 * Itens "em breve" / mapa do produto ficam no roadmap (ADR-013), não na sidebar.
 */
export type NavItem = {
  label: string;
  href: string;
  permission: PermissionKey;
};

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Relações",
    items: [
      { label: "Trabalhadores", href: "/trabalhadores", permission: "worker.read" },
      { label: "Empresas", href: "/empresas", permission: "company.read" },
      { label: "Convenções", href: "/convencoes", permission: "agreement.read" },
    ],
  },
  {
    label: "Financeiro",
    items: [{ label: "Cobranças", href: "/cobrancas", permission: "finance.read" }],
  },
  {
    label: "Operação",
    items: [
      { label: "Equipe", href: "/equipe", permission: "staff.read" },
      { label: "Escritórios", href: "/escritorios", permission: "office.provision" },
    ],
  },
];

export function filterNavSections(grants: UserGrant[], tenantId: string): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => can(grants, item.permission, tenantId, { tenantId })),
  })).filter((section) => section.items.length > 0);
}
