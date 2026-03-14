import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "bg-muted text-muted-foreground",
      success: "bg-success/15 text-success",
      warning: "bg-warning/15 text-warning",
      danger: "bg-danger/15 text-danger",
      info: "bg-primary/15 text-primary"
    }
  },
  defaultVariants: {
    variant: "neutral"
  }
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
};
