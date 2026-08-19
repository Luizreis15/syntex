"use client";

import * as RadixPopover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;

export function PopoverContent({ className, ...props }: RadixPopover.PopoverContentProps) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        sideOffset={8}
        align="end"
        className={cn("z-popover w-80 rounded-sm border border-border bg-surface p-3 shadow-elevated", className)}
        {...props}
      />
    </RadixPopover.Portal>
  );
}
