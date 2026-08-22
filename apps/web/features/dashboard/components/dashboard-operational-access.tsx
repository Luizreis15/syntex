import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";

export interface OperationalLink {
  href: string;
  label: string;
  hint: string;
}

/** Coluna principal sem finance.read — só rotas permitidas. */
export function DashboardOperationalAccess({ links }: { links: OperationalLink[] }) {
  if (links.length === 0) return null;

  return (
    <DashboardPanel title="Acesso operacional" subtitle="Módulos disponíveis para o seu perfil">
      <ul className="divide-y divide-border/60">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-dense font-semibold text-ink">{link.label}</span>
                <span className="text-label text-ink-3">{link.hint}</span>
              </span>
              <ArrowRight
                size={14}
                className="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}
