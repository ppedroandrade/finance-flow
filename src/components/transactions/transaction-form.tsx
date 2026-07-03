"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/hooks/use-finance";
import { cn, localDateKey } from "@/lib/utils";
import type { Transaction } from "@/types/finance";
import { transactionSchema, type TransactionFormValues as FormValues } from "@/lib/validation/transaction";

export function TransactionForm({ transaction, onSuccess }: { transaction?: Transaction; onSuccess?: () => void }) {
  const { accounts, categories, cards, addTransaction, updateTransaction } = useFinance();
  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      title: transaction?.title ?? "",
      amount: transaction?.amount ?? 0,
      type: transaction?.type ?? "expense",
      category_id: transaction?.category_id ?? "",
      date: transaction?.date ?? localDateKey(),
      payment_method: transaction?.payment_method ?? "pix",
      account_id: transaction?.account_id ?? "",
      card_id: transaction?.card_id ?? "",
      installments: transaction?.installment_total ?? 1,
      note: transaction?.note ?? "",
    },
  });
  // React Hook Form manages subscriptions internally; the compiler intentionally skips this component.
  // eslint-disable-next-line react-hooks/incompatible-library
  const type = form.watch("type");
  const payment = form.watch("payment_method");

  useEffect(() => {
    const selected = categories.find((item) => item.id === form.getValues("category_id"));
    if (selected && selected.type !== type) form.setValue("category_id", "");
  }, [type, categories, form]);

  const onSubmit = async (values: FormValues) => {
    const { installments, ...transactionValues } = values;
    const input = { ...transactionValues, account_id: values.account_id || null, card_id: values.card_id || null, note: values.note || null };
    const saved = transaction
      ? await updateTransaction(transaction.id, input)
      : await addTransaction(input, installments);
    if (!saved) return;
    toast.success(transaction ? "Lançamento atualizado" : "Lançamento adicionado");
    onSuccess?.();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-1">
        {(["expense", "income"] as const).map((value) => (
          <button key={value} type="button" onClick={() => form.setValue("type", value)}
            className={cn("h-10 rounded-lg text-sm font-semibold transition", type === value ? value === "expense" ? "bg-danger/15 text-danger" : "bg-primary/15 text-primary" : "text-muted-foreground")}>
            {value === "expense" ? "Saída" : "Entrada"}
          </button>
        ))}
      </div>
      <div>
        <Label htmlFor="title">Descrição</Label>
        <Input id="title" placeholder="Ex.: Mercado da semana" autoFocus {...form.register("title")} />
        {form.formState.errors.title && <p className="mt-1 text-xs text-danger">{form.formState.errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">Valor</Label>
          <Input id="amount" type="number" inputMode="decimal" step="0.01" placeholder="0,00" {...form.register("amount", { valueAsNumber: true })} />
          {form.formState.errors.amount && <p className="mt-1 text-xs text-danger">{form.formState.errors.amount.message}</p>}
        </div>
        <div>
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" {...form.register("date")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Conta</Label>
          <Select value={form.watch("account_id") || "none"} onValueChange={(value) => form.setValue("account_id", value === "none" ? "" : value)}>
            <SelectTrigger><SelectValue placeholder="Sem conta" /></SelectTrigger>
            <SelectContent><SelectItem value="none">Sem conta</SelectItem>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Parcelas</Label>
          <Input type="number" min={1} max={36} disabled={!!transaction || payment !== "credit_card" || type !== "expense"} {...form.register("installments", { valueAsNumber: true })} />
        </div>
      </div>
      <div>
        <Label>Categoria</Label>
        <Select value={form.watch("category_id")} onValueChange={(value) => form.setValue("category_id", value, { shouldValidate: true })}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {categories.filter((item) => item.type === type).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {form.formState.errors.category_id && <p className="mt-1 text-xs text-danger">{form.formState.errors.category_id.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Pagamento</Label>
          <Select value={payment} onValueChange={(value) => form.setValue("payment_method", value as FormValues["payment_method"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">Pix</SelectItem><SelectItem value="credit_card">Crédito</SelectItem>
              <SelectItem value="debit_card">Débito</SelectItem><SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="transfer">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Cartão</Label>
          <Select disabled={payment !== "credit_card"} value={form.watch("card_id") || "none"} onValueChange={(value) => form.setValue("card_id", value === "none" ? "" : value)}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent><SelectItem value="none">Nenhum</SelectItem>{cards.map((card) => <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="note">Observação <span className="font-normal">(opcional)</span></Label>
        <Input id="note" placeholder="Algo que queira lembrar" {...form.register("note")} />
      </div>
      <Button className="mt-2 w-full" size="lg" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Salvando..." : transaction ? "Salvar alterações" : "Adicionar lançamento"}</Button>
    </form>
  );
}
