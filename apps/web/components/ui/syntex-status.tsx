import { cn } from "@/lib/utils";
import {
  IconCheck,
  IconDispute,
  IconDot,
  IconInfo,
  IconLock,
  IconTriangleAlert,
  IconXCircle,
} from "./icons";

export type DomainState = "reconhecida" | "reivindicada" | "disputada" | "perdida" | "sensivel";
export type SystemState = "success" | "warning" | "danger" | "info";

const DOMAIN: Record<DomainState, { label: string; icon: typeof IconDot; fg: string; bg: string }> = {
  reconhecida: { label: "Ativa", icon: IconDot, fg: "text-status-reconhecida", bg: "bg-status-reconhecida-bg" },
  reivindicada: {
    label: "Pendente",
    icon: IconTriangleAlert,
    fg: "text-status-reivindicada",
    bg: "bg-status-reivindicada-bg",
  },
  disputada: { label: "Em disputa", icon: IconDispute, fg: "text-status-disputada", bg: "bg-status-disputada-bg" },
  perdida: { label: "Inativa", icon: IconXCircle, fg: "text-status-perdida", bg: "bg-status-perdida-bg" },
  sensivel: { label: "Sensível", icon: IconLock, fg: "text-status-sensivel", bg: "bg-status-sensivel-bg" },
};

const SYSTEM: Record<SystemState, { icon: typeof IconDot; fg: string }> = {
  success: { icon: IconCheck, fg: "text-success" },
  warning: { icon: IconTriangleAlert, fg: "text-warning" },
  danger: { icon: IconXCircle, fg: "text-danger" },
  info: { icon: IconInfo, fg: "text-info" },
};

type SyntexStatusProps =
  | { kind: "domain"; state: DomainState; label?: string; className?: string }
  | { kind: "system"; state: SystemState; label: string; className?: string };

/**
 * Renderiza sempre cor + ícone + texto — nunca só cor (design/SYNTEX-UI.md
 * §3, §10). Os dois conjuntos (domínio x sistema) são tipados
 * separadamente: não é possível pedir `kind="domain"` com `state="danger"`,
 * então 'disputada' não pode acidentalmente virar 'danger' num refactor.
 */
export function SyntexStatus(props: SyntexStatusProps) {
  if (props.kind === "domain") {
    const config = DOMAIN[props.state];
    const Icon = config.icon;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-label font-medium uppercase",
          config.fg,
          config.bg,
          props.className,
        )}
      >
        <Icon size={12} />
        {props.label ?? config.label}
      </span>
    );
  }

  const config = SYSTEM[props.state];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-body", config.fg, props.className)}>
      <Icon size={16} />
      {props.label}
    </span>
  );
}
