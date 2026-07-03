export type TransactionType = "income" | "expense";
export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "cash" | "transfer";
export type Frequency = "weekly" | "monthly" | "quarterly" | "yearly";
export type AccountType = "checking" | "savings" | "cash" | "investment";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  date: string;
  payment_method: PaymentMethod;
  account_id?: string | null;
  card_id?: string | null;
  invoice_month?: string | null;
  installment_group_id?: string | null;
  installment_number?: number | null;
  installment_total?: number | null;
  note?: string | null;
  import_source?: string | null;
  external_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  institution?: string | null;
  initial_balance: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  brand: "visa" | "mastercard" | "elo" | "other";
  last_digits: string;
  limit_amount: number;
  used_limit_amount?: number | null;
  limit_updated_at?: string | null;
  closing_day: number;
  due_day: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category_id: string;
  due_day: number;
  frequency: Frequency;
  is_paid: boolean;
  next_due_date: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringBillPayment {
  id: string;
  user_id: string;
  recurring_bill_id: string;
  reference_month: string;
  paid_at: string;
  transaction_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  alert_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardInvoice {
  id: string;
  user_id: string;
  card_id: string;
  reference_month: string;
  due_date: string;
  status: "open" | "closed" | "paid";
  statement_amount?: number | null;
  paid_amount: number;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export type TransactionInput = Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">;
export type CategoryInput = Pick<Category, "name" | "type" | "icon" | "color">;
export type CardInput = Pick<CreditCard, "name" | "brand" | "last_digits" | "limit_amount" | "closing_day" | "due_day" | "color">;
export type GoalInput = Pick<Goal, "name" | "target_amount" | "current_amount" | "deadline" | "icon" | "color">;
export type RecurringBillInput = Pick<RecurringBill, "name" | "amount" | "category_id" | "due_day" | "frequency" | "next_due_date">;
export type AccountInput = Pick<Account, "name" | "type" | "institution" | "initial_balance" | "color" | "is_active">;
export type BudgetInput = Pick<Budget, "category_id" | "monthly_limit" | "alert_percent" | "is_active">;

export interface ImportRow {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  category_id: string;
  payment_method: PaymentMethod;
  note: string | null;
  import_source: string;
  external_id: string;
  selected: boolean;
  duplicate: boolean;
  source_line: number;
}
