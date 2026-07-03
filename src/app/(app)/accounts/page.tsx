"use client";

import { useState } from "react";
import { Building2, Landmark, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/hooks/use-finance";
import { formatCurrency } from "@/lib/utils";
import type { AccountType } from "@/types/finance";

export default function AccountsPage() {
  const { accounts, transactions, addAccount } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", institution: "", type: "checking" as AccountType, initial_balance: 0 });
  const submit = async () => {
    if (!form.name) return toast.error("Informe o nome da conta");
    if (!await addAccount({ ...form, color: "#89f0c4", is_active: true })) return;
    setOpen(false); toast.success("Conta adicionada");
  };
  const trigger = <DialogTrigger asChild><Button><Plus className="size-4" />Nova conta</Button></DialogTrigger>;
  return <>
    <Dialog open={open} onOpenChange={setOpen}>
      <PageHeader title="Contas e saldos" description="Separe conta corrente, carteira, poupança e investimentos." action={trigger} />
      <DialogContent><DialogTitle>Nova conta</DialogTitle><DialogDescription>O saldo inicial é o valor existente antes dos lançamentos cadastrados.</DialogDescription>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Nome</Label><Input placeholder="Ex.: Conta principal" onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div><Label>Instituição</Label><Input placeholder="Ex.: Nubank" onChange={(event) => setForm({ ...form, institution: event.target.value })} /></div>
          <div><Label>Tipo</Label><Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as AccountType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="checking">Conta corrente</SelectItem><SelectItem value="savings">Poupança</SelectItem><SelectItem value="cash">Carteira</SelectItem><SelectItem value="investment">Investimentos</SelectItem></SelectContent></Select></div>
          <div className="sm:col-span-2"><Label>Saldo inicial</Label><Input type="number" step="0.01" onChange={(event) => setForm({ ...form, initial_balance: Number(event.target.value) })} /></div>
          <Button className="sm:col-span-2" onClick={submit}>Salvar conta</Button>
        </div>
      </DialogContent>
    </Dialog>
    {accounts.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{accounts.map((account) => {
      const movement = transactions.filter((transaction) => transaction.account_id === account.id).reduce((sum, transaction) => sum + (transaction.type === "income" ? transaction.amount : -transaction.amount), 0);
      const balance = account.initial_balance + movement;
      const Icon = account.type === "cash" ? Wallet : account.type === "investment" ? Landmark : Building2;
      return <Card key={account.id}><CardContent><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></span><span className="text-[10px] text-muted-foreground">{account.institution}</span></div><p className="mt-5 text-sm font-semibold">{account.name}</p><p className="mt-1 text-xs text-muted-foreground">Saldo atual</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(balance)}</p></CardContent></Card>;
    })}</div> : <EmptyState icon={Landmark} title="Nenhuma conta" description="Cadastre sua primeira conta para controlar saldos reais." action={<Button onClick={() => setOpen(true)}><Plus className="size-4" />Nova conta</Button>} />}
    <div className="mt-4 sm:hidden"><Button onClick={() => setOpen(true)}><Plus className="size-4" />Nova conta</Button></div>
  </>;
}
