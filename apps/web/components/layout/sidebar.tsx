"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  ChevronDown,
  FileCheck2,
  LayoutGrid,
  ReceiptText,
  Scale,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavIconKey, NavSection } from "./nav-config";

const NAV_ICON: Record<NavIconKey, LucideIcon> = {
  "layout-grid": LayoutGrid,
  users: Users,
  "building-2": Building2,
  scale: Scale,
  "file-check-2": FileCheck2,
  "receipt-text": ReceiptText,
  "user-cog": UserCog,
  briefcase: Briefcase,
};

export interface SidebarProps {
  sections: NavSection[];
  tenantName: string;
  tenantLegalName: string;
  branchLabel: string;
}

function initials(label: string): string {
  return label.slice(0, 2).toUpperCase();
}

/**
 * Sidebar command dark (Visual System v2). Tenant/branch switcher continua
 * informativo: um auth user ↔ um tenant no schema atual; sem mecanismo de
 * troca de unidade — `<div>` com cara de controle da referência, não botão morto.
 *
 * Itens: só Core operacional (ADR-022) — sem mapa fantasma.
 */
export function Sidebar({ sections, tenantName, tenantLegalName, branchLabel }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="surface-command flex h-screen w-shell shrink-0 flex-col text-shell-ink">
      <div className="flex items-center gap-2.5 border-b border-shell-border px-5 py-4">
        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-sm bg-petrol-600">
          <span className="pointer-events-none absolute inset-0 rounded-sm bg-teal/40 mix-blend-screen" />
          <span className="relative text-component font-black text-shell-ink">S</span>
        </span>
        <span className="leading-none">
          <span className="block text-component font-black tracking-tight text-shell-ink">SYNTEX</span>
          <span className="mt-0.5 block text-label font-bold uppercase tracking-widest text-shell-ink-2">
            Soluções Sindicais
          </span>
        </span>
      </div>

      <div
        role="group"
        aria-label="Tenant e unidade atuais"
        className="mx-3 mt-3 flex items-center gap-3 rounded-sm border border-shell-border bg-shell-ink/[0.06] px-3 py-2.5"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-petrol-700 font-mono text-label text-shell-ink">
          {initials(tenantName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label font-extrabold text-shell-ink" title={tenantLegalName}>
            {tenantName}
          </span>
          <span className="block truncate text-label text-shell-ink-2">{branchLabel}</span>
        </span>
        <ChevronDown size={14} className="shrink-0 text-shell-ink-2" aria-hidden />
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-6">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-2 pb-1.5 text-label font-bold uppercase tracking-wide text-shell-ink-2/70">
              {section.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = NAV_ICON[item.icon];
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-dense font-semibold transition-colors",
                        active
                          ? "bg-shell-ink/[0.1] text-shell-ink"
                          : "text-shell-ink-2 hover:bg-shell-ink/[0.06] hover:text-shell-ink",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={15} className="shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
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
