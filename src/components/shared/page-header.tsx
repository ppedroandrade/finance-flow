import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
      <div><h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p></div>
      {action && <div className="hidden sm:block">{action}</div>}
    </div>
  );
}

