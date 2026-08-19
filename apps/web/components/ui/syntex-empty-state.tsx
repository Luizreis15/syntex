import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SyntexEmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Empty state descreve o que apareceria ali e oferece a próxima ação — sem
 * ilustração (design/SYNTEX-UI.md §11). Usado também para erro e
 * sem-permissão, trocando só o texto e a ação.
 */
export function SyntexEmptyState({ title, description, action, className }: SyntexEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-12 text-center", className)}>
      <p className="text-component font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-body text-ink-2">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
