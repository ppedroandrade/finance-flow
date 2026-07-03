"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { GoalProgressCard } from "@/components/goals/goal-progress-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/hooks/use-finance";
import { EmptyState } from "@/components/shared/empty-state";

export default function GoalsPage() {
  const { goals, addGoal } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", target_amount: 0, current_amount: 0, deadline: "" });
  const submit = async () => {
    if (!form.name || !form.deadline || form.target_amount <= 0) return toast.error("Preencha os dados da meta");
    if (!await addGoal({ ...form, icon: "Target", color: "#89f0c4" })) return;
    setOpen(false); toast.success("Meta criada");
  };
  const trigger = <DialogTrigger asChild><Button><Plus className="size-4" />Criar meta</Button></DialogTrigger>;
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <PageHeader title="Planos que saem do papel" description="Transforme objetivos grandes em progresso visível, um pouco por vez." action={trigger} />
        <DialogContent><DialogTitle>Nova meta</DialogTitle><DialogDescription>Defina um destino para o dinheiro que você está guardando.</DialogDescription>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nome da meta</Label><Input placeholder="Ex.: Minha casa" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Valor desejado</Label><Input type="number" inputMode="decimal" onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })} /></div>
            <div><Label>Valor atual</Label><Input type="number" inputMode="decimal" onChange={(e) => setForm({ ...form, current_amount: Number(e.target.value) })} /></div>
            <div className="sm:col-span-2"><Label>Prazo</Label><Input type="date" onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            <Button className="sm:col-span-2" onClick={submit}>Começar esta meta</Button>
          </div>
        </DialogContent>
      </Dialog>
      {goals.length ? <><div className="mb-5 rounded-[22px] border border-primary/15 bg-primary/[.06] p-5"><p className="text-xs text-primary">Patrimônio em construção</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Você já acumulou <strong className="font-semibold text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(goals.reduce((sum, goal) => sum + goal.current_amount, 0))}</strong> em objetivos. Consistência vale mais que pressa.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{goals.map((goal) => <GoalProgressCard key={goal.id} goal={goal} />)}</div></> : <EmptyState icon={Target} title="Nenhuma meta criada" description="Crie uma meta para acompanhar seu progresso financeiro." action={<Button onClick={() => setOpen(true)}><Plus className="size-4" />Criar meta</Button>} />}
      <div className="mt-4 sm:hidden"><Button onClick={() => setOpen(true)}><Plus className="size-4" />Criar meta</Button></div>
    </>
  );
}
