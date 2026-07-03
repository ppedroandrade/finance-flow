"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useFinance } from "@/hooks/use-finance";
import { formatCurrency } from "@/lib/utils";

export function SpendingChart() {
  const { transactions, categories } = useFinance();
  const now = new Date();
  const expenses = transactions.filter((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    return item.type === "expense" && date.getMonth() === now.getMonth();
  });
  const data = categories.filter((category) => category.type === "expense").map((category) => ({
    name: category.name,
    value: expenses.filter((item) => item.category_id === category.id).reduce((sum, item) => sum + item.amount, 0),
    color: category.color,
  })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) return <div className="grid min-h-[260px] place-items-center px-6 text-center text-xs text-muted-foreground">Ainda não há despesas neste mês.</div>;
  return (
    <div className="grid min-h-[260px] grid-cols-[1fr_1.05fr] items-center gap-2">
      <div className="relative h-52 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius="70%" outerRadius="94%" paddingAngle={4} dataKey="value" stroke="none">
              {data.map((item) => <Cell key={item.name} fill={item.color} />)}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: "#171e1b", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><span className="text-[10px] text-muted-foreground">Total</span><strong className="text-sm">{formatCurrency(total, true)}</strong></div>
      </div>
      <div className="space-y-3">
        {data.slice(0, 5).map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{item.name}</span>
            <span className="text-xs font-semibold">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
