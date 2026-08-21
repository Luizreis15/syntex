import { can, type PermissionKey, type UserGrant } from "@syntex/permissions";

/**
 * Navegação do painel do sindicato — eixos Cadastro / Atendimento (ADR-016).
 * Módulo sem permissão some. Portais externos não entram aqui.
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
    label: "Início",
    items: [{ label: "Painel", href: "/painel", permission: "company.read" }],
  },
  {
    label: "Cadastro",
    items: [
      { label: "Empresas", href: "/empresas", permission: "company.read" },
      { label: "Trabalhadores", href: "/trabalhadores", permission: "worker.read" },
    ],
  },
  {
    label: "Financeiro",
    items: [{ label: "Cobranças", href: "/cobrancas", permission: "finance.read" }],
  },
  {
    label: "Atendimento",
    items: [{ label: "Filiação", href: "/filiacao", permission: "membership.read" }],
  },
  {
    label: "Operação",
    items: [
      { label: "Convenções", href: "/convencoes", permission: "agreement.read" },
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
