"use client";

import { Radio } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/hooks/use-finance";
import { formatCurrency } from "@/lib/utils";
import type { CreditCard } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CreditCardCardProps {
  card: CreditCard;
  referenceMonth: string;
}

export function CreditCardCard({ card, referenceMonth }: CreditCardCardProps) {
  const { cardInvoices, transactions, markInvoicePaid } = useFinance();
  const purchases = transactions.filter((item) => {
    const fallbackMonth = `${item.date.slice(0, 7)}-01`;
    return item.card_id === card.id && item.type === "expense" && (item.invoice_month ?? fallbackMonth) === referenceMonth;
  }).reduce((sum, item) => sum + item.amount, 0);
  const invoice = cardInvoices.find((item) => item.card_id === card.id && item.reference_month === referenceMonth);
  const statementAmount = invoice?.statement_amount ?? purchases;
  const paidAmount = invoice?.paid_amount ?? 0;
  const remainingAmount = Math.max(statementAmount - paidAmount, 0);
  const usedLimit = card.used_limit_amount ?? purchases;
  const availableLimit = Math.max(card.limit_amount - usedLimit, 0);
  const percent = Math.min((usedLimit / card.limit_amount) * 100, 100);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long" })
    .format(new Date(`${referenceMonth}T12:00:00`));
  const statusLabel = invoice?.status === "paid"
    ? "Fatura paga"
    : invoice?.status === "closed"
      ? `Fechada · vence ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${invoice.due_date}T12:00:00`))}`
      : invoice
        ? `Aberta · vence ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${invoice.due_date}T12:00:00`))}`
        : "Sem fatura registrada";
  return (
    <article className="relative min-h-61 overflow-hidden rounded-[26px] border border-white/12 p-5 shadow-[0_24px_60px_rgba(0,0,0,.25)] sm:p-6" style={{ background: `radial-gradient(circle at 90% 0%, ${card.color}55, transparent 45%), linear-gradient(145deg, ${card.color}20, #151b19 68%)` }}>
      <div className="absolute -right-12 -bottom-20 size-52 rounded-full border border-white/5" /><div className="absolute -right-5 -bottom-24 size-52 rounded-full border border-white/5" />
      <div className="relative flex items-start justify-between"><div><p className="text-xs text-white/55">Finance Flow</p><h3 className="mt-1 font-semibold">{card.name}</h3></div><Radio className="size-6 rotate-90 text-white/60" /></div>
      <div className="relative mt-8"><p className="text-xs text-white/50">•••• •••• •••• {card.last_digits}</p><p className="mt-5 text-[10px] text-white/45 uppercase">Fatura de <span className="capitalize">{monthLabel}</span></p><p className="mt-1 font-display text-2xl font-semibold">{formatCurrency(remainingAmount)}</p>{paidAmount > 0 && <p className="mt-1 text-[10px] text-primary">{formatCurrency(paidAmount)} já pagos</p>}</div>
      <div className="relative mt-5"><div className="mb-2 flex justify-between text-[10px] text-white/55"><span>{formatCurrency(usedLimit)} utilizado</span><span>{formatCurrency(availableLimit)} disponível</span></div><Progress value={percent} className="bg-white/10" indicatorClassName="bg-white/80" /><p className="mt-1.5 text-right text-[9px] text-white/40">limite total {formatCurrency(card.limit_amount)}</p></div>
      <div className="relative mt-4 flex items-center justify-between"><span className={`text-[10px] font-semibold ${invoice?.status === "paid" ? "text-primary" : invoice?.status === "closed" ? "text-warning" : "text-white/55"}`}>{statusLabel}</span>{remainingAmount > 0 && invoice?.status !== "paid" && <Button size="sm" variant="secondary" onClick={async () => { if (await markInvoicePaid(card.id, referenceMonth)) toast.success("Fatura marcada como paga"); }}>Marcar paga</Button>}</div>
    </article>
  );
}
