import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "border-border bg-muted text-muted-foreground",
      success: "border-green-200 bg-green-50 text-green-700",
      warning: "border-amber-200 bg-amber-50 text-amber-700",
      destructive: "border-red-200 bg-red-50 text-red-700",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function statusVariant(status: string): BadgeProps["variant"] {
  switch (status) {
    case "reconhecida":
      return "success";
    case "reivindicada":
      return "neutral";
    case "disputada":
      return "warning";
    case "perdida":
      return "destructive";
    default:
      return "neutral";
  }
}
