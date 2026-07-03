"use client";

import { useState } from "react";
import { CalendarClock, Check, Circle, Plus } from "lucide-react";
import { toast } from "sonner";
import { CategoryBadge } from "@/components/categories/category-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/hooks/use-finance";
import { cn, formatCurrency } from "@/lib/utils";

export default function RecurringPage() {
  const { recurringBills, categories, toggleBill, addRecurringBill } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", amount: 0, category_id: "", due_day: 10, frequency: "monthly" as const });
  const pending = recurringBills.filter((item) => !item.is_paid).reduce((sum, item) => sum + item.amount, 0);
  const nextBill = recurringBills.filter((item) => !item.is_paid).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))[0];
  const submit = async () => {
    if (!form.name || !form.category_id || form.amount <= 0) return toast.error("Preencha nome, valor e categoria");
    const due = new Date();
    due.setDate(Math.min(form.due_day, 28));
    if (due < new Date()) due.setMonth(due.getMonth() + 1);
    if (!await addRecurringBill({ ...form, next_due_date: due.toISOString().slice(0, 10) })) return;
    setOpen(false);
    toast.success("Conta recorrente adicionada");
  };
  const trigger = <DialogTrigger asChild><Button><Plus className="size-4" />Nova conta</Button></DialogTrigger>;
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <PageHeader title="Contas no automático" description="Veja o que está por vir e marque pagamentos sem perder o ritmo." action={trigger} />
        <DialogContent><DialogTitle>Nova conta recorrente</DialogTitle><DialogDescription>Cadastre uma vez para acompanhar todo mês.</DialogDescription>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nome da conta</Label><Input placeholder="Ex.: Internet" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Valor</Label><Input type="number" inputMode="decimal" onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
            <div><Label>Vencimento</Label><Input type="number" min={1} max={31} value={form.due_day} onChange={(e) => setForm({ ...form, due_day: Number(e.target.value) })} /></div>
            <div><Label>Categoria</Label><Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{categories.filter((item) => item.type === "expense").map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Frequência</Label><Select value={form.frequency} onValueChange={(value) => setForm({ ...form, frequency: value as "monthly" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Mensal</SelectItem></SelectContent></Select></div>
            <Button className="sm:col-span-2" onClick={submit}>Salvar conta</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="shadow-none"><CardContent><p className="text-[11px] text-muted-foreground">Pendente no mês</p><p className="mt-2 text-xl font-semibold">{formatCurrency(pending)}</p></CardContent></Card>
        <Card className="shadow-none"><CardContent><p className="text-[11px] text-muted-foreground">Contas fixas</p><p className="mt-2 text-xl font-semibold">{recurringBills.length}</p></CardContent></Card>
        <Card className="col-span-2 hidden shadow-none sm:block"><CardContent><p className="text-[11px] text-muted-foreground">Próximo vencimento</p><p className="mt-2 text-xl font-semibold">{nextBill ? `dia ${nextBill.due_day}` : "Nenhum"}</p></CardContent></Card>
      </div>
      <Card><CardContent>
        <div className="mb-5 flex items-center gap-2"><CalendarClock className="size-4 text-primary" /><h3 className="font-semibold">Agenda de contas</h3></div>
        <div className="space-y-2">
          {recurringBills.map((bill) => {
            const category = categories.find((item) => item.id === bill.category_id);
            return <div key={bill.id} className={cn("flex items-center gap-3 rounded-2xl border border-border p-3.5 transition sm:p-4", bill.is_paid && "opacity-50")}>
              <button onClick={async () => { if (await toggleBill(bill.id)) toast.success(bill.is_paid ? "Marcada como pendente" : "Conta marcada como paga"); }} className={cn("grid size-9 shrink-0 place-items-center rounded-full border", bill.is_paid ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground")} >{bill.is_paid ? <Check className="size-4" /> : <Circle className="size-3" />}</button>
              <div className="min-w-0 flex-1"><p className={cn("truncate text-sm font-medium", bill.is_paid && "line-through")}>{bill.name}</p><div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground"><span>Vence dia {bill.due_day}</span>{category && <><span>•</span><CategoryBadge category={category} compact /></>}</div></div>
              <div className="text-right"><p className="text-sm font-semibold">{formatCurrency(bill.amount)}</p><p className={cn("mt-1 text-[10px]", bill.is_paid ? "text-primary" : "text-warning")}>{bill.is_paid ? "Pago" : "Pendente"}</p></div>
            </div>;
          })}
        </div>
      </CardContent></Card>
      <div className="mt-4 sm:hidden"><Button onClick={() => setOpen(true)}><Plus className="size-4" />Nova conta</Button></div>
    </>
  );
}
