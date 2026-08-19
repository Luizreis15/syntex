import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconChevronRight } from "./icons";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface SyntexPageHeaderProps {
  breadcrumbs?: Breadcrumb[];
  title: string;
  status?: ReactNode;
  metadata?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Anatomia obrigatória de workspace (design/SYNTEX-UI.md §8):
 * breadcrumb → título + status → metadata → ações.
 */
export function SyntexPageHeader({ breadcrumbs, title, status, metadata, actions, className }: SyntexPageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3 border-b border-border bg-surface px-6 py-5", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-label text-ink-3">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {i > 0 && <IconChevronRight size={12} />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-ink-2">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-page-title font-semibold text-ink">{title}</h1>
          {status}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {metadata && <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body text-ink-2">{metadata}</div>}
    </header>
  );
}
