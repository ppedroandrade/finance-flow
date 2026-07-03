/**
 * Baseline compatible with `supabase gen types`.
 * Run `SUPABASE_PROJECT_ID=... npm run db:types` after applying migrations to
 * replace this file with the exact types generated from the live database.
 */
import type {
  Account, Budget, CardInvoice, Category, CreditCard, Goal,
  RecurringBill, RecurringBillPayment, Transaction,
} from "./finance";

type BaseFields = "id" | "created_at" | "updated_at";
type Insert<Row extends { user_id: string }> =
  Partial<Omit<Row, BaseFields | "user_id">> & { user_id: string };
type Table<Row extends { user_id: string }> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert<Row> & Record<string, unknown>;
  Update: Partial<Omit<Row, BaseFields | "user_id">> & Record<string, unknown>;
  Relationships: [];
};

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface AppOwnerRow {
  singleton: boolean;
  user_id: string;
  require_mfa: boolean;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      app_owner: Table<AppOwnerRow>;
      profiles: Table<ProfileRow>;
      transactions: Table<Transaction>;
      accounts: Table<Account>;
      categories: Table<Category>;
      cards: Table<CreditCard>;
      card_invoices: Table<CardInvoice>;
      recurring_bills: Table<Omit<RecurringBill, "is_paid">>;
      recurring_bill_payments: Table<RecurringBillPayment>;
      budgets: Table<Budget>;
      goals: Table<Goal>;
    };
    Views: Record<never, never>;
    Functions: {
      is_app_owner: { Args: Record<never, never>; Returns: boolean };
      enable_owner_mfa: { Args: Record<never, never>; Returns: undefined };
    };
    Enums: {
      transaction_type: "income" | "expense";
      payment_method: "pix" | "credit_card" | "debit_card" | "cash" | "transfer";
      bill_frequency: "weekly" | "monthly" | "quarterly" | "yearly";
      card_brand: "visa" | "mastercard" | "elo" | "other";
      account_type: "checking" | "savings" | "cash" | "investment";
      invoice_status: "open" | "closed" | "paid";
    };
    CompositeTypes: Record<never, never>;
  };
};
