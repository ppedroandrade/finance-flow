import { describe, expect, it } from "vitest";
import { transactionSchema } from "@/lib/validation/transaction";

const valid = {
  title: "Mercado", amount: 100, type: "expense", category_id: "category",
  date: "2026-07-03", payment_method: "pix", account_id: "", card_id: "",
  installments: 1, note: "",
};

describe("validação de lançamento", () => {
  it("aceita um lançamento válido", () => {
    expect(transactionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita valor negativo e parcelamento fora do limite", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: -1 }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, installments: 37 }).success).toBe(false);
  });
});
