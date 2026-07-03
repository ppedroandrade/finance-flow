"use client";

import { useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { toast } from "sonner";
import { CreditCardCard } from "@/components/cards/credit-card-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/hooks/use-finance";
import { EmptyState } from "@/components/shared/empty-state";
import { localMonthKey } from "@/lib/utils";

export default function CardsPage() {
  const { cards, cardInvoices, addCard } = useFinance();
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", last_digits: "", limit_amount: 0, closing_day: 1, due_day: 10 });
  const currentMonth = `${localMonthKey()}-01`;
  const invoiceMonths = [...new Set(cardInvoices.map((invoice) => invoice.reference_month))]
    .sort((a, b) => a.localeCompare(b));
  const upcomingMonth = invoiceMonths.find((month) => month >= currentMonth);
  const referenceMonth = selectedMonth ?? upcomingMonth ?? invoiceMonths.at(-1) ?? currentMonth;
  const monthOptions = [...new Set([currentMonth, ...invoiceMonths])].sort((a, b) => a.localeCompare(b));
  const monthLabel = (month: string) => new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
    .format(new Date(`${month}T12:00:00`));
  const submit = async () => {
    if (!form.name || form.limit_amount <= 0) return toast.error("Preencha nome e limite");
    if (!await addCard({ ...form, brand: "mastercard", color: "#7c5cff" })) return;
    setOpen(false); toast.success("Cartão adicionado");
  };
  const trigger = <DialogTrigger asChild><Button><Plus className="size-4" />Adicionar cartão</Button></DialogTrigger>;
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <PageHeader title="Seus cartões, sem surpresa" description="Acompanhe limites e concentre os gastos de cada cartão." action={<div className="flex gap-2"><Select value={referenceMonth} onValueChange={setSelectedMonth}><SelectTrigger className="w-42 capitalize"><SelectValue /></SelectTrigger><SelectContent>{monthOptions.map((month) => <SelectItem key={month} value={month} className="capitalize">{monthLabel(month)}</SelectItem>)}</SelectContent></Select>{trigger}</div>} />
        <DialogContent><DialogTitle>Novo cartão</DialogTitle><DialogDescription>Use apenas os quatro últimos dígitos. Nunca pediremos o número completo.</DialogDescription>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nome do cartão</Label><Input placeholder="Ex.: Nubank" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Últimos 4 dígitos</Label><Input inputMode="numeric" maxLength={4} placeholder="0000" onChange={(e) => setForm({ ...form, last_digits: e.target.value })} /></div>
            <div><Label>Limite</Label><Input type="number" inputMode="decimal" onChange={(e) => setForm({ ...form, limit_amount: Number(e.target.value) })} /></div>
            <div><Label>Fecha dia</Label><Input type="number" min={1} max={31} value={form.closing_day} onChange={(e) => setForm({ ...form, closing_day: Number(e.target.value) })} /></div>
            <div><Label>Vence dia</Label><Input type="number" min={1} max={31} value={form.due_day} onChange={(e) => setForm({ ...form, due_day: Number(e.target.value) })} /></div>
            <Button className="sm:col-span-2" onClick={submit}>Salvar cartão</Button>
          </div>
        </DialogContent>
      </Dialog>
      {cards.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map((card) => <CreditCardCard key={card.id} card={card} referenceMonth={referenceMonth} />)}</div> : <EmptyState icon={CreditCard} title="Nenhum cartão cadastrado" description="Adicione um cartão para acompanhar limite e fatura." action={<Button onClick={() => setOpen(true)}><Plus className="size-4" />Adicionar cartão</Button>} />}
      <div className="mt-4 sm:hidden"><Button onClick={() => setOpen(true)}><Plus className="size-4" />Adicionar cartão</Button></div>
    </>
  );
}
