import { DynamicIcon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/finance";

export function CategoryBadge({ category, compact = false }: { category?: Category; compact?: boolean }) {
  if (!category) return null;
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full text-xs font-medium text-muted-foreground", !compact && "bg-surface-2 px-2.5 py-1.5")}>
      <span className="grid size-6 place-items-center rounded-full" style={{ color: category.color, backgroundColor: `${category.color}18` }}>
        <DynamicIcon name={category.icon} className="size-3.5" />
      </span>
      {!compact && category.name}
    </span>
  );
}
