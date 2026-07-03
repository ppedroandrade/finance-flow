import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-surface-1/50 px-6 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
      <h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

