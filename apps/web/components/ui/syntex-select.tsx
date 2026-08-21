"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { IconCheck, IconChevronDown } from "./icons";

export interface SyntexSelectOption {
  value: string;
  label: string;
}

export interface SyntexSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SyntexSelectOption[];
  "aria-label": string;
  className?: string;
}

// Radix Select não aceita item com value="" (reservado internamente para
// "sem seleção"). Os filtros deste produto pensam em "" como "sem filtro" —
// o sentinel só existe aqui dentro, nunca vaza para quem chama.
const EMPTY_SENTINEL = "__all__";

/**
 * Select tokenizado sobre o primitive Radix — substitui o <select> nativo
 * do sistema operacional, que quebra o design system (prompt 02.1 §3).
 */
export function SyntexSelect({ value, onValueChange, options, className, ...props }: SyntexSelectProps) {
  return (
    <RadixSelect.Root
      value={value === "" ? EMPTY_SENTINEL : value}
      onValueChange={(next) => onValueChange(next === EMPTY_SENTINEL ? "" : next)}
    >
      <RadixSelect.Trigger
        aria-label={props["aria-label"]}
        className={cn(
          "flex h-input items-center justify-between gap-2 rounded-sm border border-border bg-surface px-3 text-body text-ink outline-none data-[placeholder]:text-ink-3 focus-visible:border-petrol-600",
          className,
        )}
      >
        <RadixSelect.Value />
        <RadixSelect.Icon>
          <IconChevronDown size={14} className="text-ink-3" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-dropdown overflow-hidden rounded-sm border border-border bg-surface shadow-elevated"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value === "" ? EMPTY_SENTINEL : option.value}
                className="relative flex cursor-pointer items-center rounded-xs py-1.5 pl-7 pr-3 text-body text-ink outline-none data-[highlighted]:bg-surface-2"
              >
                <RadixSelect.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <IconCheck size={14} className="text-petrol-700" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
