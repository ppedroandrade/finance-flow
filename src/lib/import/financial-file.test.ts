import { describe, expect, it } from "vitest";
import {
  CsvMappingRequiredError, parseFinancialFile, parsePdfTextLines, suggestCategory,
} from "./financial-file";

describe("importador financeiro", () => {
  it("interpreta CSV brasileiro com valores de entrada e saída", async () => {
    const file = new File([
      "Data;Descrição;Valor\n03/07/2026;Mercado Central;-123,45\n04/07/2026;Salário;5.000,00",
    ], "extrato.csv", { type: "text/csv" });
    const rows = await parseFinancialFile(file);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: "2026-07-03", amount: 123.45, type: "expense" });
    expect(rows[1]).toMatchObject({ amount: 5000, type: "income" });
  });

  it("solicita mapeamento para cabeçalhos desconhecidos", async () => {
    const file = new File(["Quando;Onde;Quanto\n03/07/2026;Teste;10,00"], "custom.csv");
    await expect(parseFinancialFile(file)).rejects.toBeInstanceOf(CsvMappingRequiredError);
    const rows = await parseFinancialFile(file, undefined, { date: "Quando", title: "Onde", amount: "Quanto" });
    expect(rows[0].title).toBe("Teste");
  });

  it("interpreta transações OFX e preserva o FITID para deduplicação", async () => {
    const file = new File([`OFXHEADER:100
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260703120000<TRNAMT>-42.90<FITID>abc-1<NAME>PADARIA</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`], "extrato.ofx");
    const rows = await parseFinancialFile(file);
    expect(rows[0]).toMatchObject({ title: "PADARIA", amount: 42.9, type: "expense", external_id: "ofx:abc-1" });
  });

  it("interpreta linhas extraídas de uma fatura PDF", () => {
    const rows = parsePdfTextLines([
      "Fatura do cartão 2026",
      "03/07 MERCADO CENTRAL 123,45",
      "04/07 PAGAMENTO RECEBIDO 500,00 C",
      "Total da fatura 623,45",
    ], "fatura.pdf");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: "2026-07-03", type: "expense", payment_method: "credit_card" });
    expect(rows[1].type).toBe("income");
  });

  it("aprende categoria usando o histórico", () => {
    const categories = [{ id: "food", name: "Alimentação", type: "expense" as const }];
    const history = [{ title: "Mercado Central Loja 10", type: "expense" as const, category_id: "food" }];
    expect(suggestCategory("Mercado Central", "expense", categories, history)).toBe("food");
  });
});
