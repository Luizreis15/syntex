"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavSection } from "./nav-config";

export interface SidebarProps {
  sections: NavSection[];
  tenantName: string;
  tenantLegalName: string;
  branchLabel: string;
}

/**
 * Sidebar 248px em --shell-950 (design/SYNTEX-UI.md §8). Tenant switcher e
 * branch switcher desta fatia são informativos, não interativos: um único
 * auth user pertence a um único tenant no schema atual, e não há mecanismo
 * de escopo por unidade ligado a nada ainda — um chevron clicável aqui
 * prometeria uma troca que não existe.
 */
export function Sidebar({ sections, tenantName, tenantLegalName, branchLabel }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-shell shrink-0 flex-col bg-shell-950 text-shell-ink">
      <div className="border-b border-shell-border px-4 py-4">
        <p className="font-serif text-component font-semibold text-shell-ink">Syntex</p>
      </div>

      <div className="border-b border-shell-border px-4 py-3">
        <p className="truncate text-component font-semibold text-shell-ink" title={tenantLegalName}>
          {tenantName}
        </p>
        <p className="truncate text-label text-shell-ink-2" title={tenantLegalName}>
          {tenantLegalName}
        </p>
      </div>

      <div className="border-b border-shell-border px-4 py-3">
        <p className="text-label uppercase text-shell-ink-2">Unidade sindical</p>
        <p className="text-body text-shell-ink">{branchLabel}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, i) => (
          <div key={section.label} className={cn(i > 0 && "mt-5")}>
            <p className="px-2 pb-1.5 text-label uppercase tracking-wide text-shell-ink-2">{section.label}</p>
            <ul className="flex flex-col gap-px">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block border-l-2 border-transparent px-2.5 py-1.5 text-body text-shell-ink-2 transition-colors hover:bg-shell-900 hover:text-shell-ink",
                        active && "border-petrol-600 bg-shell-900 font-medium text-shell-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
