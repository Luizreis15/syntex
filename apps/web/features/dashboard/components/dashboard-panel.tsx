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

export interface DashboardPanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  density?: "default" | "compact";
  variant?: SyntexPanelVariant;
  rail?: SyntexAccentTone;
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
}: DashboardPanelProps) {
  return (
    <SyntexPanel variant={variant} rail={rail} className={className}>
      <SyntexPanelHeader density={density}>
        <div>
          <SyntexPanelTitle className={density === "compact" ? "text-dense" : undefined}>
            {title}
          </SyntexPanelTitle>
          {subtitle ? <SyntexPanelDescription>{subtitle}</SyntexPanelDescription> : null}
        </div>
        {action}
      </SyntexPanelHeader>
      <SyntexPanelBody>{children}</SyntexPanelBody>
    </SyntexPanel>
  );
}
