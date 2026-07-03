"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, className, indicatorClassName }: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  const safeValue = value ?? 0;
  return (
    <ProgressPrimitive.Root className={cn("relative h-2 overflow-hidden rounded-full bg-surface-3", className)} value={safeValue}>
      <ProgressPrimitive.Indicator className={cn("h-full rounded-full bg-primary transition-transform duration-700", indicatorClassName)} style={{ transform: `translateX(-${100 - Math.min(safeValue, 100)}%)` }} />
    </ProgressPrimitive.Root>
  );
}
