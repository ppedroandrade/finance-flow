"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useFinance } from "@/hooks/use-finance";
import { formatCurrency } from "@/lib/utils";

export function MonthlyEvolutionChart() {
  const { transactions } = useFinance();
  const now = new Date();
  const data = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const items = transactions.filter((item) => {
      const itemDate = new Date(`${item.date}T12:00:00`);
      return itemDate.getMonth() === month && itemDate.getFullYear() === year;
    });
    return {
      month: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", ""),
      income: items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0),
      expense: items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0),
    };
  });
  const hasData = data.some((item) => item.income > 0 || item.expense > 0);

  if (!hasData) return <div className="grid h-[250px] place-items-center text-center text-xs text-muted-foreground">Seus dados aparecerão aqui após o primeiro lançamento.</div>;
  return (
    <div className="h-[250px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="income" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#89f0c4" stopOpacity={.25} /><stop offset="100%" stopColor="#89f0c4" stopOpacity={0} /></linearGradient>
            <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff8b78" stopOpacity={.16} /><stop offset="100%" stopColor="#ff8b78" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.055)" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#7e8b85", fontSize: 11 }} dy={10} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: "#171e1b", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, fontSize: 12 }} />
          <Area type="monotone" dataKey="income" name="Entradas" stroke="#89f0c4" strokeWidth={2.2} fill="url(#income)" />
          <Area type="monotone" dataKey="expense" name="Saídas" stroke="#ff8b78" strokeWidth={2} fill="url(#expense)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
