"use client";

import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;

export function DropdownMenuContent({ className, ...props }: RadixDropdownMenu.DropdownMenuContentProps) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        sideOffset={6}
        align="end"
        className={cn(
          "z-dropdown min-w-[200px] rounded-sm border border-border bg-surface p-1 shadow-elevated",
          className,
        )}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: RadixDropdownMenu.DropdownMenuItemProps) {
  return (
    <RadixDropdownMenu.Item
      className={cn(
        "cursor-pointer rounded-xs px-2 py-1.5 text-body text-ink outline-none data-[highlighted]:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: RadixDropdownMenu.DropdownMenuLabelProps) {
  return <RadixDropdownMenu.Label className={cn("px-2 py-1 text-label uppercase text-ink-3", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: RadixDropdownMenu.DropdownMenuSeparatorProps) {
  return <RadixDropdownMenu.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}
