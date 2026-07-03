import { Calendar, CheckCircle2 } from "lucide-react";
import { DynamicIcon } from "@/components/shared/icon";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import type { Goal } from "@/types/finance";

export function GoalProgressCard({ goal }: { goal: Goal }) {
  const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const complete = percent >= 100;
  return (
    <article className="rounded-[22px] border border-border bg-surface-1 p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-2xl" style={{ color: goal.color, backgroundColor: `${goal.color}15` }}><DynamicIcon name={goal.icon} className="size-5" /></span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${complete ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted-foreground"}`}>{complete ? "Concluída" : "Em andamento"}</span>
      </div>
      <h3 className="mt-5 font-semibold">{goal.name}</h3>
      <div className="mt-4 flex items-end justify-between"><div><p className="text-[10px] text-muted-foreground">Você já guardou</p><p className="mt-1 text-lg font-semibold">{formatCurrency(goal.current_amount)}</p></div><p className="text-xs text-muted-foreground">de {formatCurrency(goal.target_amount)}</p></div>
      <Progress value={percent} className="mt-4" indicatorClassName={complete ? "bg-primary" : ""} />
      <div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>{Math.round(percent)}% concluído</span><span className="flex items-center gap-1">{complete ? <CheckCircle2 className="size-3 text-primary" /> : <Calendar className="size-3" />}{new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(new Date(`${goal.deadline}T12:00:00`))}</span></div>
    </article>
  );
}

