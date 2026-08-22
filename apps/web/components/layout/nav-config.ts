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
  | "life-buoy"
  | "calendar-days"
  | "shield-check"
  | "gauge"
  | "gavel"
  | "wallet"
  | "receipt-text"
  | "bar-chart-3"
  | "megaphone"
  | "sparkles"
  | "heart-handshake"
  | "user-cog"
  | "briefcase"
  | "settings";

/**
 * Navegação do painel do sindicato (Visual System v2 — ADR-017, referência
 * aprovada `syntex-vital-core`). Estrutura de sete grupos é a aprovada pelo
 * negócio; a maioria dos itens ainda não tem módulo por trás.
 *
 * `built: true` — módulo existe. Some da navegação se o usuário não tiver
 * a permissão (regra de sempre; RLS + app-layer continuam sendo a
 * autorização real, isto é só UI).
 *
 * `built: false` — módulo aprovado no mapa do produto, sem rota ainda.
 * Aparece para todo mundo, sem link, visualmente inerte — nunca abre tela
 * vazia. Isto supera a consequência de ADR-013 ("sidebar só mostra o que
 * existe, sem menu-fantasma"); ver ADR-017 para o registro da decisão.
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
    }
  | { label: string; built: false; icon: NavIconKey };

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
      { label: "Representação", built: false, icon: "scale" },
      { label: "Convenções", built: true, href: "/convencoes", permission: "agreement.read", icon: "file-check-2" },
    ],
  },
  {
    label: "Operação",
    items: [
      { label: "Atendimento", built: true, href: "/filiacao", permission: "membership.read", icon: "life-buoy" },
      { label: "Agenda", built: false, icon: "calendar-days" },
      { label: "Homologações", built: false, icon: "shield-check" },
      { label: "Fiscalização", built: false, icon: "gauge" },
      { label: "Jurídico", built: false, icon: "gavel" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Arrecadação", built: false, icon: "wallet" },
      { label: "Cobranças", built: true, href: "/cobrancas", permission: "finance.read", icon: "receipt-text" },
      { label: "Financeiro", built: false, icon: "bar-chart-3" },
    ],
  },
  {
    label: "Engajamento",
    items: [
      { label: "Comunicação", built: false, icon: "megaphone" },
      { label: "Campanhas", built: false, icon: "sparkles" },
      { label: "Benefícios", built: false, icon: "heart-handshake" },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { label: "Analytics", built: false, icon: "bar-chart-3" },
      { label: "Syntex Intelligence", built: false, icon: "sparkles" },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Equipe", built: true, href: "/equipe", permission: "staff.read", icon: "user-cog" },
      // Escritórios não está na lista aprovada pela referência — é rota real
      // que já existe (ADR-015, delegação de escritório de contabilidade);
      // mantida aqui para não regredir funcionalidade.
      { label: "Escritórios", built: true, href: "/escritorios", permission: "office.provision", icon: "briefcase" },
      { label: "Configurações", built: false, icon: "settings" },
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
    items: section.items.filter((item) => !item.built || isBuiltNavItemVisible(item, grants, tenantId)),
  })).filter((section) => section.items.length > 0);
}
