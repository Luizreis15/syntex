import Link from "next/link";
import { ArrowRight, Building2, Receipt, UserPlus, type LucideIcon } from "lucide-react";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { DashboardFinanceRadar } from "@/features/dashboard/components/dashboard-finance-radar";
import type { ChargeIntel } from "@/features/dashboard/charge-intel";

export interface QuickAction {
  href: string;
  label: string;
  variant: "primary" | "secondary";
  icon?: "building" | "user" | "receipt";
}

const ICONS: Record<NonNullable<QuickAction["icon"]>, LucideIcon> = {
  building: Building2,
  user: UserPlus,
  receipt: Receipt,
};

export interface DashboardSideRailProps {
  actions: QuickAction[];
  financeIntel?: ChargeIntel | null;
}

/** Rail: Radar visual + ações compactas em panel raised. */
export function DashboardSideRail({ actions, financeIntel = null }: DashboardSideRailProps) {
  const primary = actions.find((a) => a.variant === "primary");
  const secondary = actions.filter((a) => a.variant === "secondary");
  const PrimaryIcon = primary?.icon ? ICONS[primary.icon] : null;
  const hasActions = actions.length > 0;

  if (!hasActions && !financeIntel) return null;

  return (
    <div className="flex flex-col gap-4">
      {financeIntel ? <DashboardFinanceRadar intel={financeIntel} /> : null}

      {hasActions ? (
        <DashboardPanel title="Ações rápidas" density="compact" variant="raised" rail="blue">
          <div className="flex flex-col gap-1 px-2.5 py-2">
            {primary ? (
              <Link
                href={primary.href}
                className="inline-flex h-8 w-fit items-center gap-1.5 rounded-control bg-petrol-700 px-2.5 text-label font-medium text-shell-ink transition-colors hover:bg-petrol-600"
              >
                {PrimaryIcon ? <PrimaryIcon size={14} aria-hidden /> : null}
                {primary.label.startsWith("+") ? primary.label : `+ ${primary.label}`}
              </Link>
            ) : null}

            {secondary.length > 0 ? (
              <ul className="mt-1 flex flex-col">
                {secondary.map((action) => {
                  const Icon = action.icon ? ICONS[action.icon] : null;
                  return (
                    <li key={action.href}>
                      <Link
                        href={action.href}
                        className="group row-hover flex h-9 items-center gap-2 rounded-control px-1.5 text-dense text-ink"
                      >
                        {Icon ? <Icon size={14} className="shrink-0 text-ink-3" aria-hidden /> : null}
                        <span className="min-w-0 flex-1 font-medium">{action.label}</span>
                        <ArrowRight
                          size={13}
                          className="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </DashboardPanel>
      ) : null}
    </div>
  );
}
