import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn("h-12 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-base text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 sm:text-sm", className)}
      {...props}
    />
  );
}

