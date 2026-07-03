"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { AlertCard } from "@/components/dashboard/alert-card";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { MonthlyEvolutionChart } from "@/components/dashboard/monthly-evolution-chart";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { TransactionList } from "@/components/transactions/transaction-list";
import { QuickTransaction } from "@/components/transactions/quick-transaction";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFinance } from "@/hooks/use-finance";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { recurringBills } = useFinance();
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());
  const nextBills = recurringBills.filter((bill) => !bill.is_paid).slice(0, 3);
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">Seu resumo de</p><h2 className="font-display text-2xl font-semibold tracking-tight capitalize sm:text-3xl">{monthName}</h2></div>
        <div className="hidden sm:block"><QuickTransaction /></div>
      </div>
      <DashboardCards />
      <div className="lg:hidden"><AlertCard /></div>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card className="hidden sm:block">
          <CardHeader><div><h3 className="font-semibold">Seu ritmo financeiro</h3><p className="mt-1 text-xs text-muted-foreground">Entradas e saídas nos últimos 6 meses</p></div><div className="flex gap-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-primary" />Entradas</span><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-danger" />Saídas</span></div></CardHeader>
          <CardContent><MonthlyEvolutionChart /></CardContent>
        </Card>
        <Card>
          <CardHeader><div><h3 className="font-semibold">Para onde foi</h3><p className="mt-1 text-xs text-muted-foreground">Gastos por categoria</p></div><span className="text-xs capitalize text-muted-foreground">{monthName}</span></CardHeader>
          <CardContent className="pt-2"><SpendingChart /></CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <div><h3 className="font-semibold">Últimos lançamentos</h3><p className="mt-1 text-xs text-muted-foreground">O que movimentou sua conta</p></div>
            <Link href="/transactions" className="flex items-center gap-1 text-xs font-semibold text-primary">Ver todos <ArrowRight className="size-3" /></Link>
          </CardHeader>
          <CardContent><TransactionList compact /></CardContent>
        </Card>
        <div className="space-y-4">
          <div className="hidden lg:block"><AlertCard /></div>
          <Card>
            <CardHeader><div><h3 className="font-semibold">Próximas contas</h3><p className="mt-1 text-xs text-muted-foreground">Não deixe nada passar</p></div><CalendarDays className="size-4 text-muted-foreground" /></CardHeader>
            <CardContent className="space-y-4">
              {nextBills.map((bill) => <div key={bill.id} className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-xs font-bold text-warning">{bill.due_day}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{bill.name}</p><p className="text-[10px] text-muted-foreground">vence em breve</p></div><p className="text-xs font-semibold">{formatCurrency(bill.amount)}</p></div>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
