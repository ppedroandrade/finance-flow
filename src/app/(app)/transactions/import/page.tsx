"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, FileSpreadsheet,
  FileText, LoaderCircle, LockKeyhole, ShieldCheck, UploadCloud, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useFinance } from "@/hooks/use-finance";
import {
  CsvMappingRequiredError, parseFinancialFile, PdfPasswordRequiredError,
  suggestCategory, transactionFingerprint, type CsvColumnMapping,
} from "@/lib/import/financial-file";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { ImportRow, TransactionInput, TransactionType } from "@/types/finance";

export default function ImportTransactionsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { cards, categories, transactions, importTransactions } = useFinance();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [selectedCard, setSelectedCard] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvMapping, setCsvMapping] = useState<CsvColumnMapping>({ date: "", title: "", amount: "" });

  const processFile = async (file?: File, password?: string, mapping?: CsvColumnMapping) => {
    if (!file) return;
    setPendingFile(file);
    setReading(true); setError(""); setNeedsPassword(false);
    if (!mapping) setCsvHeaders([]);
    try {
      const parsed = await parseFinancialFile(file, password, mapping);
      const existingIds = new Set(transactions.map((item) => item.external_id).filter(Boolean));
      const duplicateKeys = new Set(transactions.map((item) =>
        transactionFingerprint(item.date, item.title, item.amount, item.type)));
      const reviewed = parsed.map((row) => {
        const duplicate = existingIds.has(row.external_id) ||
          duplicateKeys.has(transactionFingerprint(row.date, row.title, row.amount, row.type));
        return {
          ...row,
          category_id: suggestCategory(row.title, row.type, categories, transactions),
          duplicate,
          selected: !duplicate,
        };
      });
      if (!reviewed.length) throw new Error("Nenhum lançamento válido foi encontrado no arquivo.");
      setRows(reviewed);
      setFileName(file.name);
      setPdfPassword("");
    } catch (cause) {
      setRows([]);
      if (cause instanceof PdfPasswordRequiredError) setNeedsPassword(true);
      else if (cause instanceof CsvMappingRequiredError) {
        setCsvHeaders(cause.headers);
        setError(cause.message);
      }
      else setError(cause instanceof Error ? cause.message : "Não foi possível ler o arquivo.");
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const updateRow = (id: string, patch: Partial<ImportRow>) =>
    setRows((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const selected = rows.filter((row) => row.selected);
  const missingCategories = selected.filter((row) => !row.category_id).length;
  const total = selected.reduce((sum, row) => sum + (row.type === "income" ? row.amount : -row.amount), 0);

  const confirmImport = async () => {
    if (!selected.length) return toast.error("Selecione ao menos um lançamento");
    if (missingCategories) return toast.error("Escolha uma categoria para todos os itens selecionados");
    setImporting(true);
    const card = cards.find((item) => item.id === selectedCard);
    const inputs: TransactionInput[] = selected.map(({ id, title, amount, type, category_id, date, payment_method, note, import_source, external_id, duplicate }) => {
      const purchaseDate = new Date(`${date}T12:00:00`);
      const invoiceOffset = card && purchaseDate.getDate() > card.closing_day ? 1 : 0;
      return {
        title, amount, type, category_id, date,
        payment_method: selectedCard && type === "expense" ? "credit_card" : payment_method,
        note, import_source, external_id: duplicate ? `${external_id}:manual:${id}` : external_id, card_id: selectedCard && type === "expense" ? selectedCard : null,
        invoice_month: selectedCard && type === "expense"
          ? new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + invoiceOffset, 1).toISOString().slice(0, 10)
          : null,
      };
    });
    const count = await importTransactions(inputs);
    setImporting(false);
    if (!count) return;
    toast.success(`${count} ${count === 1 ? "lançamento importado" : "lançamentos importados"}`);
    router.push("/transactions");
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/transactions" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" />Voltar aos lançamentos</Link>
      <div className="mb-6"><p className="text-xs font-semibold text-primary">IMPORTAÇÃO DE EXTRATO</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Traga seus lançamentos de uma vez</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Envie o OFX do banco ou o CSV da conta/cartão. Você revisa tudo antes de salvar.</p></div>

      {!rows.length ? (
        <Card>
          <CardContent>
            <input ref={inputRef} type="file" accept=".pdf,.ofx,.csv,application/pdf,text/csv,application/x-ofx" className="sr-only" onChange={(event) => void processFile(event.target.files?.[0])} />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
              onDrop={(event) => { event.preventDefault(); setDragging(false); void processFile(event.dataTransfer.files[0]); }}
              className={cn("flex min-h-72 w-full flex-col items-center justify-center rounded-[20px] border border-dashed px-6 text-center transition", dragging ? "border-primary bg-primary/[.07]" : "border-border bg-surface-2/35 hover:border-primary/30 hover:bg-surface-2/60")}
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">{reading ? <LoaderCircle className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}</span>
              <h3 className="mt-5 font-semibold">{reading ? "Lendo seu arquivo..." : "Solte seu arquivo aqui"}</h3>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">ou toque para procurar no dispositivo. Formatos aceitos: PDF, OFX e CSV.</p>
              <span className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">Escolher arquivo</span>
            </button>
            {needsPassword && <form onSubmit={(event) => { event.preventDefault(); void processFile(pendingFile ?? undefined, pdfPassword); }} className="mt-4 rounded-2xl border border-warning/20 bg-warning/[.06] p-4"><div className="flex items-start gap-3"><LockKeyhole className="mt-1 size-4 shrink-0 text-warning" /><div className="flex-1"><p className="text-sm font-semibold">PDF protegido por senha</p><p className="mt-1 text-xs text-muted-foreground">A senha é usada somente no navegador e não é armazenada.</p><div className="mt-3 flex gap-2"><Input type="password" value={pdfPassword} onChange={(event) => setPdfPassword(event.target.value)} placeholder="Senha do PDF" autoFocus /><Button type="submit" disabled={!pdfPassword || reading}>Abrir</Button></div></div></div></form>}
            {!!csvHeaders.length && <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/[.06] p-4"><div className="flex items-start gap-3"><FileSpreadsheet className="mt-1 size-4 shrink-0 text-warning" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Mapeie as colunas do CSV</p><p className="mt-1 text-xs text-muted-foreground">O banco usa nomes de coluna que ainda não reconhecemos.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{(["date", "title", "amount"] as const).map((field) => <div key={field}><p className="mb-1.5 text-[10px] font-semibold text-muted-foreground">{field === "date" ? "Data" : field === "title" ? "Descrição" : "Valor"}</p><Select value={csvMapping[field]} onValueChange={(value) => setCsvMapping((current) => ({ ...current, [field]: value }))}><SelectTrigger className="h-10"><SelectValue placeholder="Escolher coluna" /></SelectTrigger><SelectContent>{csvHeaders.map((header) => <SelectItem key={header} value={header}>{header}</SelectItem>)}</SelectContent></Select></div>)}</div><Button className="mt-4" disabled={!csvMapping.date || !csvMapping.title || !csvMapping.amount || reading} onClick={() => void processFile(pendingFile ?? undefined, undefined, csvMapping)}>Aplicar mapeamento</Button></div></div></div>}
            {error && !csvHeaders.length && <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/15 bg-danger/[.07] p-4 text-sm text-danger"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="flex gap-3 rounded-2xl border border-border p-4"><FileText className="size-5 shrink-0 text-warning" /><div><p className="text-sm font-semibold">PDF do banco</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Funciona com PDFs que tenham texto selecionável.</p></div></div>
              <div className="flex gap-3 rounded-2xl border border-border p-4"><FileText className="size-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">OFX do banco</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Normalmente disponível em “Exportar extrato” no internet banking.</p></div></div>
              <div className="flex gap-3 rounded-2xl border border-border p-4"><FileSpreadsheet className="size-5 shrink-0 text-[#8bd5ff]" /><div><p className="text-sm font-semibold">CSV da conta ou cartão</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">O arquivo precisa conter data, descrição e valor.</p></div></div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-primary/[.05] p-3 text-[11px] text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />O conteúdo do arquivo é processado localmente no seu navegador. O PDF original e sua senha não são enviados nem armazenados.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><FileSpreadsheet className="size-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{fileName}</p><p className="mt-1 text-xs text-muted-foreground">{rows.length} itens encontrados · {rows.filter((row) => row.duplicate).length} duplicados ignorados</p></div>
              {cards.length > 0 && <div className="w-full sm:w-52"><Select value={selectedCard || "none"} onValueChange={(value) => setSelectedCard(value === "none" ? "" : value)}><SelectTrigger className="h-10"><SelectValue placeholder="Vincular cartão" /></SelectTrigger><SelectContent><SelectItem value="none">Sem cartão</SelectItem>{cards.map((card) => <SelectItem key={card.id} value={card.id}>{card.name} •{card.last_digits}</SelectItem>)}</SelectContent></Select></div>}
              <Button variant="outline" size="sm" onClick={() => { setRows([]); setFileName(""); setSelectedCard(""); }}>Trocar arquivo</Button>
            </CardContent>
          </Card>

          {!categories.length && <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/[.07] p-4 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /><p>Você precisa criar ao menos uma categoria antes de importar. <Link href="/categories" className="font-semibold text-warning underline">Criar categorias</Link></p></div>}

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-surface-1 p-4"><p className="text-[10px] text-muted-foreground">Selecionados</p><p className="mt-2 text-lg font-semibold">{selected.length}</p></div>
            <div className="rounded-2xl border border-border bg-surface-1 p-4"><p className="text-[10px] text-muted-foreground">Sem categoria</p><p className={cn("mt-2 text-lg font-semibold", missingCategories && "text-warning")}>{missingCategories}</p></div>
            <div className="rounded-2xl border border-border bg-surface-1 p-4"><p className="text-[10px] text-muted-foreground">Saldo importado</p><p className={cn("mt-2 truncate text-sm font-semibold sm:text-lg", total >= 0 ? "text-primary" : "text-danger")}>{formatCurrency(total)}</p></div>
          </div>

          <Card>
            <div className="hidden grid-cols-[36px_1fr_110px_150px_130px] gap-3 border-b border-border px-6 py-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase md:grid">
              <span /><span>Lançamento</span><span>Tipo</span><span>Categoria</span><span className="text-right">Valor</span>
            </div>
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <div key={row.id} className={cn("grid gap-3 p-4 md:grid-cols-[36px_1fr_110px_150px_130px] md:items-center md:px-6", (!row.selected || row.duplicate) && "opacity-45")}>
                  <button type="button" onClick={() => updateRow(row.id, { selected: !row.selected })} className={cn("grid size-6 place-items-center rounded-lg border transition", row.selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-2")}>{row.selected && <Check className="size-3.5" />}</button>
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{row.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{formatDate(row.date)} · linha {row.source_line}</p>{row.duplicate && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-warning"><AlertTriangle className="size-3" />Possível duplicado — marque para importar mesmo assim</span>}</div>
                  <Select disabled={!row.selected} value={row.type} onValueChange={(value) => {
                    const type = value as TransactionType;
                    updateRow(row.id, { type, category_id: suggestCategory(row.title, type, categories, transactions) });
                  }}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="expense">Saída</SelectItem><SelectItem value="income">Entrada</SelectItem></SelectContent></Select>
                  <Select disabled={!row.selected} value={row.category_id || undefined} onValueChange={(value) => updateRow(row.id, { category_id: value })}><SelectTrigger className={cn("h-10", row.selected && !row.category_id && "border-warning/50")}><SelectValue placeholder="Escolher" /></SelectTrigger><SelectContent>{categories.filter((category) => category.type === row.type).map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>
                  <div className="flex items-center justify-between md:block md:text-right"><span className="text-[10px] text-muted-foreground md:hidden">Valor</span><p className={cn("text-sm font-semibold", row.type === "income" ? "text-primary" : "text-foreground")}>{row.type === "expense" ? "− " : "+ "}{formatCurrency(row.amount)}</p></div>
                </div>
              ))}
            </div>
          </Card>

          <div className="sticky bottom-22 z-30 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#141a18]/95 p-3 shadow-2xl backdrop-blur-xl lg:bottom-4">
            <button onClick={() => setRows((items) => items.map((item) => ({ ...item, selected: false })))} className="flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground"><X className="size-4" />Limpar</button>
            <Button onClick={confirmImport} disabled={importing || !selected.length || !!missingCategories}>{importing ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{importing ? "Importando..." : `Importar ${selected.length}`}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
