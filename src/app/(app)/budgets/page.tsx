"use client";

import { useState } from "react";
import { Gauge, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/hooks/use-finance";
import { cn, formatCurrency } from "@/lib/utils";

export default function BudgetsPage() {
  const { budgets, categories, transactions, addBudget } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category_id: "", monthly_limit: 0, alert_percent: 80 });
  const now = new Date();
  const submit = async () => {
    if (!form.category_id || form.monthly_limit <= 0) return toast.error("Informe categoria e limite");
    if (!await addBudget({ ...form, is_active: true })) return;
    setOpen(false); toast.success("Orçamento criado");
  };
  const trigger = <DialogTrigger asChild><Button><Plus className="size-4" />Novo orçamento</Button></DialogTrigger>;
  return <>
    <Dialog open={open} onOpenChange={setOpen}>
      <PageHeader title="Orçamentos mensais" description="Defina limites por categoria e receba alertas antes de passar do ponto." action={trigger} />
      <DialogContent><DialogTitle>Novo orçamento</DialogTitle><DialogDescription>O limite é reiniciado automaticamente a cada mês.</DialogDescription><div className="mt-6 space-y-4">
        <div><Label>Categoria</Label><Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{categories.filter((category) => category.type === "expense" && !budgets.some((budget) => budget.category_id === category.id)).map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Limite mensal</Label><Input type="number" step="0.01" onChange={(event) => setForm({ ...form, monthly_limit: Number(event.target.value) })} /></div>
        <div><Label>Alertar em (%)</Label><Input type="number" min={1} max={100} value={form.alert_percent} onChange={(event) => setForm({ ...form, alert_percent: Number(event.target.value) })} /></div>
        <Button className="w-full" onClick={submit}>Salvar orçamento</Button>
      </div></DialogContent>
    </Dialog>
    {budgets.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{budgets.map((budget) => {
      const category = categories.find((item) => item.id === budget.category_id);
      const spent = transactions.filter((transaction) => { const date = new Date(`${transaction.date}T12:00:00`); return transaction.category_id === budget.category_id && transaction.type === "expense" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).reduce((sum, transaction) => sum + transaction.amount, 0);
      const percent = Math.round((spent / budget.monthly_limit) * 100);
      return <Card key={budget.id}><CardContent><div className="flex justify-between gap-3"><div><p className="text-xs text-muted-foreground">Categoria</p><p className="mt-1 font-semibold">{category?.name ?? "Categoria"}</p></div><span className={cn("text-sm font-semibold", percent >= 100 ? "text-danger" : percent >= budget.alert_percent ? "text-warning" : "text-primary")}>{percent}%</span></div><Progress value={percent} className="mt-5" indicatorClassName={percent >= 100 ? "bg-danger" : percent >= budget.alert_percent ? "bg-warning" : "bg-primary"} /><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>{formatCurrency(spent)} gastos</span><span>de {formatCurrency(budget.monthly_limit)}</span></div></CardContent></Card>;
    })}</div> : <EmptyState icon={Gauge} title="Nenhum orçamento" description="Crie limites para acompanhar os gastos importantes." action={<Button onClick={() => setOpen(true)}><Plus className="size-4" />Novo orçamento</Button>} />}
  </>;
}
