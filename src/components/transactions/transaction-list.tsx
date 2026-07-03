"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CategoryBadge } from "@/components/categories/category-badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "./transaction-form";
import { useFinance } from "@/hooks/use-finance";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/finance";
import { EmptyState } from "@/components/shared/empty-state";
import { WalletCards } from "lucide-react";

export function TransactionList({ items, compact = false }: { items?: Transaction[]; compact?: boolean }) {
  const { transactions, categories, deleteTransaction } = useFinance();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const list = (items ?? transactions).slice(0, compact ? 6 : undefined);
  const remove = async (id: string) => {
    const success = await deleteTransaction(id);
    if (!success) return;
    setMenu(null); toast.success("Lançamento excluído");
  };

  if (!list.length) return <EmptyState icon={WalletCards} title="Nenhum lançamento ainda" description="Adicione sua primeira entrada ou saída para começar." />;
  return (
    <>
      <div className="divide-y divide-border">
        {list.map((transaction) => {
          const category = categories.find((item) => item.id === transaction.category_id);
          return (
            <div key={transaction.id} className="group flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 sm:gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-[13px]" style={{ color: category?.color, backgroundColor: `${category?.color}12` }}>
                {category && <CategoryBadge category={category} compact />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{transaction.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{formatDate(transaction.date)}</span><span>•</span><span>{category?.name}</span></div>
              </div>
              <div className="text-right">
                <p className={cn("text-sm font-semibold", transaction.type === "income" ? "text-primary" : "text-foreground")}>{transaction.type === "expense" ? "−" : "+"} {formatCurrency(transaction.amount)}</p>
                {!compact && <p className="mt-1 hidden text-[10px] text-muted-foreground sm:block">{transaction.payment_method.replace("_", " ")}</p>}
              </div>
              {!compact && (
                <div className="relative">
                  <button onClick={() => setMenu(menu === transaction.id ? null : transaction.id)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"><MoreHorizontal className="size-4" /></button>
                  {menu === transaction.id && <div className="absolute top-9 right-0 z-20 w-36 rounded-xl border border-border bg-surface-2 p-1 shadow-xl">
                    <button onClick={() => { setEditing(transaction); setMenu(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-surface-3"><Pencil className="size-3.5" />Editar</button>
                    <button onClick={() => remove(transaction.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-danger hover:bg-danger/10"><Trash2 className="size-3.5" />Excluir</button>
                  </div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent><DialogTitle>Editar lançamento</DialogTitle><DialogDescription>Atualize os dados deste lançamento.</DialogDescription>{editing && <TransactionForm transaction={editing} onSuccess={() => setEditing(null)} />}</DialogContent>
      </Dialog>
    </>
  );
}
