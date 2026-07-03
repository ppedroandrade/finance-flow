import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";

export interface TransactionFilters {
  query?: string;
  type?: "income" | "expense";
  categoryId?: string;
  month?: string;
  page?: number;
  pageSize?: number;
}

export function createFinanceService(client: SupabaseClient<Database>) {
  return {
    async loadFinanceData(userId: string) {
      return Promise.all([
        client.from("profiles").select("full_name, avatar_url").eq("user_id", userId).maybeSingle(),
        client.from("transactions").select("*").order("date", { ascending: false }).limit(1000),
        client.from("accounts").select("*").eq("is_active", true).order("created_at"),
        client.from("categories").select("*").order("name"),
        client.from("cards").select("*").order("created_at"),
        client.from("card_invoices").select("*").order("reference_month", { ascending: false }).limit(24),
        client.from("recurring_bills").select("*").order("next_due_date"),
        client.from("recurring_bill_payments").select("*").order("reference_month", { ascending: false }).limit(120),
        client.from("budgets").select("*").eq("is_active", true),
        client.from("goals").select("*").order("deadline"),
      ]);
    },

    async listTransactions(filters: TransactionFilters) {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 25;
      let query = client.from("transactions").select("*", { count: "exact" }).order("date", { ascending: false });
      if (filters.query) query = query.ilike("title", `%${filters.query.replace(/[%_]/g, "")}%`);
      if (filters.type) query = query.eq("type", filters.type);
      if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
      if (filters.month) {
        const [year, month] = filters.month.split("-").map(Number);
        const start = `${filters.month}-01`;
        const end = new Date(year, month, 1).toISOString().slice(0, 10);
        query = query.gte("date", start).lt("date", end);
      }
      return query.range((page - 1) * pageSize, page * pageSize - 1);
    },
  };
}
