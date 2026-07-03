"use client";

import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { useFinance } from "@/hooks/use-finance";
import { formatCurrency } from "@/lib/utils";

export function DashboardCards() {
  const { accounts, transactions } = useFinance();
  const now = new Date();
  const current = transactions.filter((item) => {
    const value = new Date(`${item.date}T12:00:00`);
    return value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear();
  });
  const income = current.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = current.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;

  const incomeCount = current.filter((item) => item.type === "income").length;
  const expenseCount = current.filter((item) => item.type === "expense").length;
  const transactionBalance = transactions.reduce((sum, item) => sum + (item.type === "income" ? item.amount : -item.amount), 0);
  const totalBalance = accounts.length
    ? accounts.reduce((sum, account) => sum + account.initial_balance + transactions.filter((item) => item.account_id === account.id).reduce((subtotal, item) => subtotal + (item.type === "income" ? item.amount : -item.amount), 0), 0)
    : transactionBalance;
  const items = [
    { label: "Saldo disponível", value: totalBalance, detail: "Saldo de todos os lançamentos", icon: Wallet, color: "text-primary", featured: true },
    { label: "Entradas no mês", value: income, detail: `${incomeCount} ${incomeCount === 1 ? "recebimento" : "recebimentos"}`, icon: ArrowDownLeft, color: "text-[#8bd5ff]" },
    { label: "Saídas no mês", value: expenses, detail: `${expenseCount} ${expenseCount === 1 ? "lançamento" : "lançamentos"}`, icon: ArrowUpRight, color: "text-danger" },
    { label: "Sobra do mês", value: balance, detail: `${income ? Math.round((balance / income) * 100) : 0}% da sua renda`, icon: PiggyBank, color: "text-warning" },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {items.map(({ label, value, detail, icon: Icon, color, featured }, index) => (
        <article key={label} className={`relative overflow-hidden rounded-[20px] border p-4 sm:p-5 ${featured ? "col-span-2 border-primary/15 bg-[linear-gradient(145deg,rgba(137,240,196,.12),rgba(17,23,21,.7))] lg:col-span-1" : "border-border bg-surface-1"}`}>
          {featured && <div className="absolute -top-14 -right-8 size-36 rounded-full bg-primary/7 blur-2xl" />}
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</p>
            <span className={`grid size-8 place-items-center rounded-xl bg-white/[.04] ${color}`}><Icon className="size-4" /></span>
          </div>
          <p className="mt-5 font-display text-xl font-semibold tracking-[-.04em] sm:text-2xl">{formatCurrency(value)}</p>
          <p className={`mt-1.5 text-[10px] sm:text-xs ${index === 0 ? "text-primary" : "text-muted-foreground"}`}>{detail}</p>
        </article>
      ))}
    </section>
  );
}
