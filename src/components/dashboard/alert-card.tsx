"use client";

import { ArrowUpRight, Lightbulb, Sparkles } from "lucide-react";
import { useFinance } from "@/hooks/use-finance";

export function AlertCard() {
  const { transactions, categories, budgets } = useFinance();
  const now = new Date();
  const budgetAlert = budgets.map((budget) => {
    const category = categories.find((item) => item.id === budget.category_id);
    const spent = transactions.filter((item) => {
      const date = new Date(`${item.date}T12:00:00`);
      return item.category_id === budget.category_id && item.type === "expense" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, item) => sum + item.amount, 0);
    return { category, percent: Math.round((spent / budget.monthly_limit) * 100), threshold: budget.alert_percent };
  }).filter((item) => item.percent >= item.threshold).sort((a, b) => b.percent - a.percent)[0];
  const delivery = categories.find((item) => item.name.toLocaleLowerCase("pt-BR") === "delivery");
  if (budgetAlert) return (
    <div className="relative overflow-hidden rounded-[20px] border border-warning/15 bg-[linear-gradient(145deg,rgba(245,199,107,.11),rgba(17,23,21,.8))] p-5">
      <Sparkles className="absolute -right-2 -bottom-2 size-20 text-warning/5" />
      <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/12 text-warning"><Lightbulb className="size-4" /></span><div><p className="text-xs font-semibold text-warning">Atenção ao orçamento</p><p className="mt-1 text-sm leading-relaxed">Você já usou <strong className="text-foreground">{budgetAlert.percent}%</strong> do limite de {budgetAlert.category?.name ?? "uma categoria"} neste mês.</p></div></div>
      <a href="/budgets" className="mt-4 flex items-center gap-1 text-xs font-semibold text-warning">Ver orçamentos <ArrowUpRight className="size-3" /></a>
    </div>
  );
  if (!delivery) return null;
  const totalFor = (monthOffset: number) => transactions.filter((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return item.category_id === delivery.id && date.getMonth() === target.getMonth() && date.getFullYear() === target.getFullYear();
  }).reduce((sum, item) => sum + item.amount, 0);
  const current = totalFor(0);
  const previous = totalFor(-1);
  if (!current || !previous || current <= previous) return null;
  const increase = Math.round(((current - previous) / previous) * 100);

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-warning/15 bg-[linear-gradient(145deg,rgba(245,199,107,.11),rgba(17,23,21,.8))] p-5">
      <Sparkles className="absolute -right-2 -bottom-2 size-20 text-warning/5" />
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/12 text-warning"><Lightbulb className="size-4" /></span>
        <div><p className="text-xs font-semibold text-warning">Um toque do Flow</p><p className="mt-1 text-sm leading-relaxed">Seus gastos com delivery subiram <strong className="font-semibold text-foreground">{increase}%</strong> em relação ao mês passado.</p></div>
      </div>
      <button className="mt-4 flex items-center gap-1 text-xs font-semibold text-warning">Ver detalhes <ArrowUpRight className="size-3" /></button>
    </div>
  );
}
