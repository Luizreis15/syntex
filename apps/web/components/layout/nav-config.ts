import { can, type PermissionKey, type UserGrant } from "@syntex/permissions";

export interface NavItem {
  label: string;
  href: string;
  permission: PermissionKey;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Todo o mapa de navegação do produto — não só o que esta fatia constrói.
 * Um item sem página real fica de fora do array (não "desabilitado"): hoje
 * isso deixa a seção "Relações" com um item só, e é honesto que seja assim
 * — Trabalhadores, Financeiro, Atendimento etc. entram quando existirem.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Relações",
    items: [{ label: "Empresas", href: "/empresas", permission: "company.read" }],
  },
];

/** Módulo sem permissão não aparece — nunca desabilitado, omitido. */
export function filterNavSections(grants: UserGrant[], tenantId: string): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => can(grants, item.permission, tenantId, { tenantId })),
  })).filter((section) => section.items.length > 0);
}
