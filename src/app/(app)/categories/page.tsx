"use client";

import { useState } from "react";
import { Plus, Shapes } from "lucide-react";
import { toast } from "sonner";
import { DynamicIcon } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/hooks/use-finance";
import type { TransactionType } from "@/types/finance";
import { EmptyState } from "@/components/shared/empty-state";

const colors = ["#89f0c4", "#8bd5ff", "#b9a4ff", "#ff8b78", "#f5c76b", "#f5a4d4"];
const icons = ["ShoppingBasket", "Utensils", "Car", "Home", "HeartPulse", "Sparkles"];

export default function CategoriesPage() {
  const { categories, transactions, addCategory } = useFinance();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [color, setColor] = useState(colors[0]);
  const [icon, setIcon] = useState(icons[0]);
  const submit = async () => {
    if (name.trim().length < 2) return toast.error("Dê um nome para a categoria");
    if (!await addCategory({ name, type, color, icon })) return;
    setOpen(false); setName(""); toast.success("Categoria criada");
  };
  const trigger = <DialogTrigger asChild><Button><Plus className="size-4" />Nova categoria</Button></DialogTrigger>;
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <PageHeader title="Categorias do seu jeito" description="Organize seu dinheiro com nomes e cores que fazem sentido para você." action={trigger} />
        <DialogContent><DialogTitle>Nova categoria</DialogTitle><DialogDescription>Personalize como seus lançamentos serão organizados.</DialogDescription>
          <div className="mt-6 space-y-5">
            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Casa nova" /></div>
            <div><Label>Tipo</Label><div className="grid grid-cols-2 gap-2">{(["expense", "income"] as const).map((item) => <button key={item} onClick={() => setType(item)} className={`h-11 rounded-xl border text-sm font-semibold ${type === item ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}>{item === "expense" ? "Saída" : "Entrada"}</button>)}</div></div>
            <div><Label>Ícone</Label><div className="flex gap-2">{icons.map((item) => <button key={item} onClick={() => setIcon(item)} className={`grid size-11 place-items-center rounded-xl border ${icon === item ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}><DynamicIcon name={item} className="size-4" /></button>)}</div></div>
            <div><Label>Cor</Label><div className="flex gap-3">{colors.map((item) => <button key={item} onClick={() => setColor(item)} className={`size-8 rounded-full transition ${color === item ? "ring-2 ring-white ring-offset-2 ring-offset-surface-1" : ""}`} style={{ backgroundColor: item }} />)}</div></div>
            <Button onClick={submit} className="w-full">Criar categoria</Button>
          </div>
        </DialogContent>
      </Dialog>
      {categories.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const count = transactions.filter((item) => item.category_id === category.id).length;
          return <Card key={category.id} className="shadow-none"><CardContent className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl" style={{ color: category.color, backgroundColor: `${category.color}15` }}><DynamicIcon name={category.icon} className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold">{category.name}</p><p className="mt-1 text-xs text-muted-foreground">{category.type === "income" ? "Entrada" : "Saída"} · {count} lançamentos</p></div><Shapes className="size-4 text-muted-foreground/30" /></CardContent></Card>;
        })}
      </div> : <EmptyState icon={Shapes} title="Nenhuma categoria" description="Crie uma categoria para organizar seus lançamentos." action={<Button onClick={() => setOpen(true)}><Plus className="size-4" />Nova categoria</Button>} />}
      <div className="mt-4 sm:hidden"><Button onClick={() => setOpen(true)}><Plus className="size-4" />Nova categoria</Button></div>
    </>
  );
}
