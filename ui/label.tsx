import * as React from "react";

import { cn } from "@/lib/utils";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("mb-1 block text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground", className)} {...props} />
);
