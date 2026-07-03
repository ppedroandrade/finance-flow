"use client";

import { Radio } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/hooks/use-finance";
import { formatCurrency, localMonthKey } from "@/lib/utils";
import type { CreditCard } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CreditCardCard({ card }: { card: CreditCard }) {
  const { cardInvoices, transactions, markInvoicePaid } = useFinance();
  const referenceMonth = `${localMonthKey()}-01`;
  const used = transactions.filter((item) => {
    const fallbackMonth = `${item.date.slice(0, 7)}-01`;
    return item.card_id === card.id && item.type === "expense" && (item.invoice_month ?? fallbackMonth) === referenceMonth;
  }).reduce((sum, item) => sum + item.amount, 0);
  const invoice = cardInvoices.find((item) => item.card_id === card.id && item.reference_month === referenceMonth);
  const closed = new Date().getDate() > card.closing_day;
  const percent = Math.min((used / card.limit_amount) * 100, 100);
  return (
    <article className="relative min-h-61 overflow-hidden rounded-[26px] border border-white/12 p-5 shadow-[0_24px_60px_rgba(0,0,0,.25)] sm:p-6" style={{ background: `radial-gradient(circle at 90% 0%, ${card.color}55, transparent 45%), linear-gradient(145deg, ${card.color}20, #151b19 68%)` }}>
      <div className="absolute -right-12 -bottom-20 size-52 rounded-full border border-white/5" /><div className="absolute -right-5 -bottom-24 size-52 rounded-full border border-white/5" />
      <div className="relative flex items-start justify-between"><div><p className="text-xs text-white/55">Finance Flow</p><h3 className="mt-1 font-semibold">{card.name}</h3></div><Radio className="size-6 rotate-90 text-white/60" /></div>
      <div className="relative mt-8"><p className="text-xs text-white/50">•••• •••• •••• {card.last_digits}</p><p className="mt-5 text-[10px] text-white/45 uppercase">Fatura atual</p><p className="mt-1 font-display text-2xl font-semibold">{formatCurrency(used)}</p></div>
      <div className="relative mt-5"><div className="mb-2 flex justify-between text-[10px] text-white/55"><span>{Math.round(percent)}% usado</span><span>limite {formatCurrency(card.limit_amount)}</span></div><Progress value={percent} className="bg-white/10" indicatorClassName="bg-white/80" /></div>
      <div className="relative mt-4 flex items-center justify-between"><span className={`text-[10px] font-semibold ${invoice?.status === "paid" ? "text-primary" : closed ? "text-warning" : "text-white/55"}`}>{invoice?.status === "paid" ? "Fatura paga" : closed ? `Fechada · vence dia ${card.due_day}` : `Aberta · fecha dia ${card.closing_day}`}</span>{used > 0 && invoice?.status !== "paid" && <Button size="sm" variant="secondary" onClick={async () => { if (await markInvoicePaid(card.id, referenceMonth)) toast.success("Fatura marcada como paga"); }}>Marcar paga</Button>}</div>
    </article>
  );
}
