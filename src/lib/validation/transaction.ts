import { z } from "zod";

export const transactionSchema = z.object({
  title: z.string().min(2, "Informe um título"),
  amount: z.number().positive("O valor deve ser maior que zero"),
  type: z.enum(["income", "expense"]),
  category_id: z.string().min(1, "Escolha uma categoria"),
  date: z.string().min(1, "Informe a data"),
  payment_method: z.enum(["pix", "credit_card", "debit_card", "cash", "transfer"]),
  account_id: z.string().optional(),
  card_id: z.string().optional(),
  installments: z.number().int().min(1).max(36),
  note: z.string().max(240).optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
