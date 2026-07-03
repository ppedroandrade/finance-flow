import Papa from "papaparse";
import type { ImportRow, TransactionType } from "@/types/finance";

export interface CsvColumnMapping {
  date: string;
  title: string;
  amount: string;
  type?: string;
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const stableHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const cleanTitle = (value: string) =>
  value.replace(/\s+/g, " ").replace(/^\d{2}\/\d{2}\s+/, "").trim() || "Lançamento importado";

function parseAmount(raw: string | number | undefined) {
  if (raw === undefined || raw === null) return Number.NaN;
  let value = String(raw).trim();
  const negative = value.includes("-") || /^\(.*\)$/.test(value) || /\bD$/i.test(value);
  value = value.replace(/[^\d.,]/g, "");
  if (!value) return Number.NaN;
  const comma = value.lastIndexOf(",");
  const dot = value.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? "," : ".";
    const thousands = decimal === "," ? /\./g : /,/g;
    value = value.replace(thousands, "").replace(decimal, ".");
  } else if (comma >= 0) {
    value = value.replace(/\./g, "").replace(",", ".");
  } else if ((value.match(/\./g) ?? []).length > 1 || (dot >= 0 && value.length - dot - 1 === 3)) {
    value = value.replace(/\./g, "");
  }
  const amount = Number(value);
  return negative ? -amount : amount;
}

function parseDate(raw: string | number | undefined) {
  if (raw === undefined || raw === null) return "";
  const value = String(raw).trim();
  if (/^\d{5}$/.test(value)) {
    const date = new Date(Date.UTC(1899, 11, 30) + Number(value) * 86400000);
    return date.toISOString().slice(0, 10);
  }
  const ofx = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (ofx) return `${ofx[1]}-${ofx[2]}-${ofx[3]}`;
  const iso = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const brazilian = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (brazilian) {
    const year = brazilian[3].length === 2 ? `20${brazilian[3]}` : brazilian[3];
    return `${year}-${brazilian[2].padStart(2, "0")}-${brazilian[1].padStart(2, "0")}`;
  }
  return "";
}

export function transactionFingerprint(date: string, title: string, amount: number, type: TransactionType) {
  return `${date}|${normalize(title)}|${amount.toFixed(2)}|${type}`;
}

function externalId(format: "ofx" | "csv", fitId: string | undefined, date: string, title: string, amount: number, type: TransactionType) {
  return fitId ? `ofx:${fitId.trim()}` : `${format}:${stableHash(transactionFingerprint(date, title, amount, type))}`;
}

function disambiguateGeneratedExternalIds(rows: ImportRow[]) {
  const occurrences = new Map<string, number>();
  return rows.map((row) => {
    if (row.external_id.startsWith("ofx:")) return row;
    const occurrence = (occurrences.get(row.external_id) ?? 0) + 1;
    occurrences.set(row.external_id, occurrence);
    return occurrence === 1 ? row : { ...row, external_id: `${row.external_id}:${occurrence}` };
  });
}

function field(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>\\s*([^<\\r\\n]+)`, "i"));
  return match?.[1]?.trim();
}

function parseOfx(text: string, source: string): ImportRow[] {
  const blocks = [...text.matchAll(/<(?:STMTTRN|CCSTMTTRN)>([\s\S]*?)<\/(?:STMTTRN|CCSTMTTRN)>/gi)];
  const isCreditCard = /<CCSTMTRS>/i.test(text);
  return blocks.flatMap((match, index) => {
    const block = match[1];
    const signedAmount = parseAmount(field(block, "TRNAMT"));
    const date = parseDate(field(block, "DTPOSTED"));
    if (!Number.isFinite(signedAmount) || !date) return [];
    const transactionCode = normalize(field(block, "TRNTYPE") ?? "");
    const incomeCodes = ["credit", "dep", "directdep", "int"];
    const expenseCodes = ["debit", "check", "payment", "fee", "pos", "atm"];
    const type: TransactionType = incomeCodes.includes(transactionCode)
      ? "income"
      : expenseCodes.includes(transactionCode)
        ? "expense"
        : signedAmount < 0 ? "expense" : "income";
    const title = cleanTitle(field(block, "NAME") || field(block, "MEMO") || "Lançamento importado");
    const amount = Math.abs(signedAmount);
    return [{
      id: crypto.randomUUID(), title, amount, type, date, category_id: "",
      payment_method: isCreditCard ? "credit_card" as const : "transfer" as const, note: field(block, "MEMO") || null,
      import_source: source, external_id: externalId("ofx", field(block, "FITID"), date, title, amount, type),
      selected: true, duplicate: false, source_line: index + 1,
    }];
  });
}

const findHeader = (headers: string[], candidates: string[], reject: string[] = []) => {
  const allowed = headers.filter((header) => !reject.some((word) => normalize(header).includes(word)));
  return allowed.find((header) => candidates.includes(normalize(header)))
    ?? allowed.find((header) => candidates.some((candidate) => normalize(header).includes(candidate)));
};

export class CsvMappingRequiredError extends Error {
  constructor(public headers: string[]) {
    super("Escolha quais colunas do CSV correspondem a data, descrição e valor.");
    this.name = "CsvMappingRequiredError";
  }
}

function parseCsv(text: string, source: string, mapping?: CsvColumnMapping): ImportRow[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true, skipEmptyLines: "greedy", transformHeader: (header) => header.trim(),
  });
  if (result.errors.length && !result.data.length) throw new Error("Não foi possível interpretar o CSV.");
  const headers = result.meta.fields ?? [];
  const dateHeader = mapping?.date || findHeader(headers, ["data", "date"]);
  const titleHeader = mapping?.title || findHeader(headers, ["descricao", "description", "historico", "lancamento", "estabelecimento", "titulo", "memo"], ["data"]);
  const amountHeader = mapping?.amount || findHeader(headers, ["valor", "amount", "quantia", "total"]);
  const debitHeader = findHeader(headers, ["debito", "debit"]);
  const creditHeader = findHeader(headers, ["credito", "credit"]);
  const typeHeader = mapping?.type || findHeader(headers, ["tipo", "type", "natureza"]);
  if (!dateHeader || !titleHeader || (!amountHeader && !debitHeader && !creditHeader)) {
    throw new CsvMappingRequiredError(headers);
  }
  const cardFile = /fatura|cart[aã]o|credit.?card/i.test(source);
  return result.data.flatMap((row, index) => {
    const debit = debitHeader ? parseAmount(row[debitHeader]) : Number.NaN;
    const credit = creditHeader ? parseAmount(row[creditHeader]) : Number.NaN;
    const signedAmount = Number.isFinite(debit) && debit !== 0 ? -Math.abs(debit)
      : Number.isFinite(credit) && credit !== 0 ? Math.abs(credit)
        : parseAmount(amountHeader ? row[amountHeader] : undefined);
    const date = parseDate(row[dateHeader]);
    if (!Number.isFinite(signedAmount) || signedAmount === 0 || !date) return [];
    const rawType = normalize(typeHeader ? row[typeHeader] ?? "" : "");
    const explicitExpense = /deb|saida|despesa|compra|payment/.test(rawType);
    const explicitIncome = /cred|entrada|receita|deposit/.test(rawType);
    const type: TransactionType = explicitExpense ? "expense" : explicitIncome ? "income" : signedAmount < 0 || cardFile ? "expense" : "income";
    const title = cleanTitle(row[titleHeader]);
    const amount = Math.abs(signedAmount);
    return [{
      id: crypto.randomUUID(), title, amount, type, date, category_id: "",
      payment_method: cardFile ? "credit_card" as const : "transfer" as const,
      note: null, import_source: source,
      external_id: externalId("csv", undefined, date, title, amount, type),
      selected: true, duplicate: false, source_line: index + 2,
    }];
  });
}

export class PdfPasswordRequiredError extends Error {
  constructor() {
    super("Este PDF é protegido. Informe a senha para continuar.");
    this.name = "PdfPasswordRequiredError";
  }
}

async function parsePdf(file: File, password?: string): Promise<ImportRow[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  let document;
  try {
    document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), password }).promise;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") throw new PdfPasswordRequiredError();
    throw new Error("Não foi possível abrir o PDF.");
  }
  const lines: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const positioned = content.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item && "transform" in item)
      .map((item) => ({ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }))
      .filter((item) => item.text);
    const groups = new Map<number, typeof positioned>();
    positioned.forEach((item) => {
      const key = Math.round(item.y / 3) * 3;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    [...groups.entries()].sort((a, b) => b[0] - a[0]).forEach(([, items]) => {
      lines.push(items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" "));
    });
  }
  if (!lines.length) throw new Error("Este PDF não contém texto selecionável. Exporte outro formato ou use OCR antes da importação.");
  return parsePdfTextLines(lines, file.name);
}

export function parsePdfTextLines(lines: string[], source: string): ImportRow[] {
  const fullText = lines.join("\n");
  const yearMatch = fullText.match(/\b(20\d{2})\b/);
  const defaultYear = yearMatch?.[1] ?? String(new Date().getFullYear());
  const cardFile = /fatura|cart[aã]o|limite dispon[ií]vel|vencimento da fatura/i.test(`${source}\n${fullText}`);
  const ignored = /saldo anterior|saldo atual|saldo do dia|saldo dispon[ií]vel|total da fatura|limite|vencimento|melhor dia|encargos|resumo/i;

  return lines.flatMap((line, index) => {
    if (ignored.test(line)) return [];
    const dateMatch = line.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
    const amounts = [...line.matchAll(/(?:R\$\s*)?(-?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})|-?\s*\d+(?:[.,]\d{2}))\s*([DC])?/gi)];
    if (!dateMatch || !amounts.length) return [];
    const amountMatch = amounts.at(-1);
    if (!amountMatch) return [];
    const rawAmount = `${amountMatch[1]}${amountMatch[2] ?? ""}`;
    const signedAmount = parseAmount(rawAmount);
    if (!Number.isFinite(signedAmount) || signedAmount === 0) return [];
    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]) : defaultYear;
    const date = parseDate(`${dateMatch[1]}/${dateMatch[2]}/${year}`);
    const creditMarker = /\bC\s*$/i.test(amountMatch[0]) || /cr[eé]dito|recebido|dep[oó]sito|estorno/i.test(line);
    const debitMarker = /\bD\s*$/i.test(amountMatch[0]) || /d[eé]bito|compra|pagamento|pix enviado|tarifa/i.test(line);
    const type: TransactionType = creditMarker ? "income" : debitMarker || cardFile || signedAmount < 0 ? "expense" : "income";
    const title = cleanTitle(line
      .replace(dateMatch[0], "")
      .replace(amountMatch[0], "")
      .replace(/\s+/g, " ")
      .trim());
    const amount = Math.abs(signedAmount);
    return [{
      id: crypto.randomUUID(), title, amount, type, date, category_id: "",
      payment_method: cardFile ? "credit_card" as const : "transfer" as const,
      note: null, import_source: source.slice(0, 120),
      external_id: externalId("csv", undefined, date, title, amount, type).replace("csv:", "pdf:"),
      selected: true, duplicate: false, source_line: index + 1,
    }];
  });
}

export async function parseFinancialFile(file: File, password?: string, csvMapping?: CsvColumnMapping) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return disambiguateGeneratedExternalIds(await parsePdf(file, password));
  const buffer = await file.arrayBuffer();
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("windows-1252").decode(buffer);
  }
  const source = file.name.slice(0, 120);
  if (extension === "ofx") return parseOfx(text, source);
  if (extension === "csv") return disambiguateGeneratedExternalIds(parseCsv(text, source, csvMapping));
  throw new Error("Formato não suportado. Use um arquivo PDF, OFX ou CSV.");
}

export function suggestCategory(
  title: string,
  type: TransactionType,
  categories: { id: string; name: string; type: TransactionType }[],
  history: { title: string; type: TransactionType; category_id: string }[] = [],
) {
  const value = normalize(title);
  const tokens = new Set(value.split(/\W+/).filter((token) => token.length >= 3));
  const learned = history.filter((item) => item.type === type).map((item) => {
    const historicalTokens = new Set(normalize(item.title).split(/\W+/).filter((token) => token.length >= 3));
    const intersection = [...tokens].filter((token) => historicalTokens.has(token)).length;
    const union = new Set([...tokens, ...historicalTokens]).size;
    return { categoryId: item.category_id, score: union ? intersection / union : 0 };
  }).sort((a, b) => b.score - a.score)[0];
  if (learned?.score >= 0.5 && categories.some((category) => category.id === learned.categoryId && category.type === type)) {
    return learned.categoryId;
  }
  const rules: Array<[string[], string[]]> = [
    [["ifood", "rappi", "restaurante", "lanchonete"], ["delivery"]],
    [["mercado", "supermercado", "carrefour", "assai", "atacadao"], ["mercado"]],
    [["uber", "99app", "onibus", "metro"], ["transporte"]],
    [["posto", "shell", "ipiranga", "combustivel"], ["gasolina"]],
    [["netflix", "spotify", "amazon prime", "assinatura"], ["assinaturas"]],
    [["farmacia", "drogaria", "hospital", "clinica"], ["saude"]],
    [["salario", "pagamento salario"], ["salario"]],
  ];
  const match = rules.find(([keywords]) => keywords.some((keyword) => value.includes(keyword)));
  const names = match?.[1] ?? [];
  return categories.find((category) => category.type === type && names.includes(normalize(category.name)))?.id
    ?? categories.find((category) => category.type === type && normalize(category.name) === "outros")?.id
    ?? "";
}
