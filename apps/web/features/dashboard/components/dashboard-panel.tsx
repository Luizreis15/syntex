import type { ReactNode } from "react";
import {
  SyntexPanel,
  SyntexPanelBody,
  SyntexPanelDescription,
  SyntexPanelHeader,
  SyntexPanelTitle,
  type SyntexPanelVariant,
} from "@/components/ui/syntex-panel";
import type { SyntexAccentTone } from "@/components/ui/syntex-accent-rail";
import { DevDemoBadge } from "@/components/ui/dev-demo-mark";

export interface DashboardPanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  density?: "default" | "compact";
  variant?: SyntexPanelVariant;
  rail?: SyntexAccentTone;
  /** C4 — bloco ilustrativo (DEV_DEMO), não operação. */
  demo?: boolean;
}

/** Painel do Command Center — delega ao SyntexPanel v2.1. */
export function DashboardPanel({
  title,
  subtitle,
  action,
  children,
  className,
  density = "default",
  variant = "raised",
  rail,
  demo = false,
}: DashboardPanelProps) {
  return (
    <SyntexPanel
      variant={variant}
      rail={rail}
      className={className}
      data-demo={demo ? "true" : undefined}
    >
      <SyntexPanelHeader density={density}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <SyntexPanelTitle className={density === "compact" ? "text-dense" : undefined}>
              {title}
            </SyntexPanelTitle>
            {demo ? <DevDemoBadge /> : null}
          </div>
          {subtitle ? <SyntexPanelDescription>{subtitle}</SyntexPanelDescription> : null}
        </div>
        {action}
      </SyntexPanelHeader>
      <SyntexPanelBody>{children}</SyntexPanelBody>
    </SyntexPanel>
  );
}
