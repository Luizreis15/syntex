import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SyntexFieldProps {
  label: string;
  children: ReactNode;
  mono?: boolean;
  className?: string;
}

/**
 * Par label/valor consistente para leitura e formulário. Dado somente
 * leitura nunca parece input desabilitado (design/SYNTEX-UI.md §47/detail
 * panel): o label fica pequeno em caixa alta, o valor no peso normal do
 * corpo. Quando `children` é um `<input>`, o mesmo layout vira campo de
 * formulário — um componente, os dois contextos.
 */
export function SyntexField({ label, children, mono, className }: SyntexFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-label uppercase text-ink-3">{label}</span>
      <div className={cn("text-body text-ink", mono && "font-mono")}>{children}</div>
    </div>
  );
}
