"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileUp, Search, SlidersHorizontal } from "lucide-react";
import { QuickTransaction } from "@/components/transactions/quick-transaction";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { useFinance } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { localMonthKey } from "@/lib/utils";

export default function TransactionsPage() {
  const { categories, currentUser, queryTransactions } = useFinance();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState(localMonthKey());
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Awaited<ReturnType<typeof queryTransactions>>["data"]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const periodLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      void queryTransactions({
        query: query || undefined, type: type === "all" ? undefined : type as "income" | "expense",
        categoryId: category === "all" ? undefined : category, month, page, pageSize: 25,
      }).then((result) => { setItems(result.data); setCount(result.count); setLoading(false); });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, type, category, month, page, currentUser, queryTransactions]);

  return (
    <>
      <PageHeader title="Tudo que entrou e saiu" description="Filtre, revise e mantenha sua vida financeira organizada." action={<div className="flex gap-2"><Button asChild variant="outline"><Link href="/transactions/import"><FileUp className="size-4" />Importar</Link></Button><QuickTransaction /></div>} />
      <Card>
        <CardContent>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_150px_180px_160px]">
            <div className="relative"><Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar lançamento" className="pl-10" /></div>
            <Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}><SelectTrigger><SlidersHorizontal className="size-4 text-muted-foreground" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="income">Entradas</SelectItem><SelectItem value="expense">Saídas</SelectItem></SelectContent></Select>
            <Select value={category} onValueChange={(value) => { setCategory(value); setPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
            <Input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(1); }} />
          </div>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3"><p className="text-xs text-muted-foreground">{loading ? "Carregando..." : `${count} lançamentos encontrados`}</p><p className="text-xs capitalize text-muted-foreground">{periodLabel}</p></div>
          <TransactionList items={items} />
          {count > 25 && <div className="mt-6 flex items-center justify-between border-t border-border pt-4"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><span className="text-xs text-muted-foreground">Página {page} de {Math.ceil(count / 25)}</span><Button variant="outline" size="sm" disabled={page >= Math.ceil(count / 25)} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div>}
        </CardContent>
      </Card>
      <div className="mt-4 flex gap-2 sm:hidden"><Button asChild variant="outline"><Link href="/transactions/import"><FileUp className="size-4" />Importar</Link></Button><QuickTransaction label="Adicionar" /></div>
    </>
  );
}
