"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createFinanceService, type TransactionFilters } from "@/services/finance-service";
import { localMonthKey } from "@/lib/utils";
import type {
  Account, AccountInput, Budget, BudgetInput, CardInput, CardInvoice, Category, CategoryInput,
  CreditCard, CurrentUser, Goal, GoalInput, RecurringBill, RecurringBillInput,
  RecurringBillPayment, Transaction, TransactionInput,
} from "@/types/finance";

interface FinanceContextValue {
  currentUser: CurrentUser | null;
  loading: boolean;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  cards: CreditCard[];
  cardInvoices: CardInvoice[];
  recurringBills: RecurringBill[];
  budgets: Budget[];
  goals: Goal[];
  addTransaction: (input: TransactionInput, installments?: number) => Promise<boolean>;
  importTransactions: (inputs: TransactionInput[]) => Promise<number>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  queryTransactions: (filters: TransactionFilters) => Promise<{ data: Transaction[]; count: number }>;
  addCategory: (input: CategoryInput) => Promise<boolean>;
  addAccount: (input: AccountInput) => Promise<boolean>;
  addBudget: (input: BudgetInput) => Promise<boolean>;
  addCard: (input: CardInput) => Promise<boolean>;
  addGoal: (input: GoalInput) => Promise<boolean>;
  addRecurringBill: (input: RecurringBillInput) => Promise<boolean>;
  markInvoicePaid: (cardId: string, referenceMonth: string) => Promise<boolean>;
  toggleBill: (id: string) => Promise<boolean>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);
type WritableTable = "transactions" | "accounts" | "categories" | "cards" | "recurring_bills" | "budgets" | "goals";

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [cardInvoices, setCardInvoices] = useState<CardInvoice[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [recurringBillPayments, setRecurringBillPayments] = useState<RecurringBillPayment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const [profileResult, transactionResult, accountResult, categoryResult, cardResult, invoiceResult, billResult, paymentResult, budgetResult, goalResult] =
      await createFinanceService(supabase).loadFinanceData(user.id);
    const failure = [profileResult, transactionResult, accountResult, categoryResult, cardResult, invoiceResult, billResult, paymentResult, budgetResult, goalResult].find((result) => result.error);
    if (failure?.error) toast.error("Não foi possível carregar seus dados");
    const profile = profileResult.data;
    setCurrentUser({
      id: user.id,
      name: profile?.full_name || user.user_metadata.full_name || user.email?.split("@")[0] || "Usuário",
      email: user.email || "",
      avatarUrl: profile?.avatar_url ?? undefined,
    });
    setTransactions(transactionResult.data ?? []);
    setAccounts(accountResult.data ?? []);
    setCategories(categoryResult.data ?? []);
    setCards(cardResult.data ?? []);
    setCardInvoices(invoiceResult.data ?? []);
    const payments = paymentResult.data ?? [];
    const month = localMonthKey();
    setRecurringBillPayments(payments);
    setRecurringBills((billResult.data ?? []).map((bill) => ({ ...bill, is_paid: payments.some((payment) => payment.recurring_bill_id === bill.id && payment.reference_month.startsWith(month)) })));
    setBudgets(budgetResult.data ?? []);
    setGoals(goalResult.data ?? []);
    setLoading(false);
  }, []);

  // Initial state is populated from the authenticated user's external Supabase store.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const userId = currentUser?.id;
  async function insert<T>(table: WritableTable, input: object, setter: React.Dispatch<React.SetStateAction<T[]>>) {
    if (!userId) return false;
    const { data, error } = await createClient().from(table).insert({ ...input, user_id: userId }).select().single();
    if (error) { toast.error(error.message); return false; }
    setter((items) => [data as T, ...items]);
    return true;
  }

  const importTransactions = async (inputs: TransactionInput[]) => {
    if (!userId || !inputs.length) return 0;
    const { data, error } = await createClient().from("transactions")
      .insert(inputs.map((input) => ({ ...input, user_id: userId }))).select();
    if (error) { toast.error(error.message); return 0; }
    const records = data ?? [];
    setTransactions((items) => [...records, ...items].sort((a, b) => b.date.localeCompare(a.date)));
    return records.length;
  };
  const addTransaction = async (input: TransactionInput, installments = 1) => {
    const selectedCard = input.card_id ? cards.find((item) => item.id === input.card_id) : undefined;
    const purchaseDate = new Date(`${input.date}T12:00:00`);
    const invoiceOffset = selectedCard && purchaseDate.getDate() > selectedCard.closing_day ? 1 : 0;
    const invoiceMonth = selectedCard
      ? new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + invoiceOffset, 1).toISOString().slice(0, 10)
      : null;
    if (installments <= 1 || input.type === "income" || !input.card_id) {
      return insert<Transaction>("transactions", { ...input, invoice_month: input.type === "expense" ? invoiceMonth : null }, setTransactions);
    }
    const groupId = crypto.randomUUID();
    const baseAmount = Math.floor((input.amount / installments) * 100) / 100;
    const records = Array.from({ length: installments }, (_, index) => {
      const invoiceDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + invoiceOffset + index, 1);
      const targetMonth = purchaseDate.getMonth() + index;
      const lastDay = new Date(purchaseDate.getFullYear(), targetMonth + 1, 0).getDate();
      const date = new Date(purchaseDate.getFullYear(), targetMonth, Math.min(purchaseDate.getDate(), lastDay));
      const amount = index === installments - 1 ? Math.round((input.amount - baseAmount * (installments - 1)) * 100) / 100 : baseAmount;
      return {
        ...input, title: `${input.title} (${index + 1}/${installments})`, amount,
        date: date.toISOString().slice(0, 10), invoice_month: invoiceDate.toISOString().slice(0, 10),
        installment_group_id: groupId, installment_number: index + 1, installment_total: installments,
      };
    });
    return (await importTransactions(records)) === records.length;
  };
  const addAccount = (input: AccountInput) => insert<Account>("accounts", input, setAccounts);
  const addBudget = (input: BudgetInput) => insert<Budget>("budgets", input, setBudgets);
  const addCategory = (input: CategoryInput) => insert<Category>("categories", input, setCategories);
  const addCard = (input: CardInput) => insert<CreditCard>("cards", input, setCards);
  const addGoal = (input: GoalInput) => insert<Goal>("goals", input, setGoals);
  const addRecurringBill = async (input: RecurringBillInput) => {
    if (!userId) return false;
    const { data, error } = await createClient().from("recurring_bills").insert({ ...input, user_id: userId }).select().single();
    if (error) { toast.error(error.message); return false; }
    setRecurringBills((items) => [{ ...data, is_paid: false }, ...items]);
    return true;
  };

  const updateTransaction = async (id: string, input: TransactionInput) => {
    const { data, error } = await createClient().from("transactions").update(input).eq("id", id).select().single();
    if (error) { toast.error(error.message); return false; }
    setTransactions((items) => items.map((item) => item.id === id ? data : item));
    return true;
  };
  const deleteTransaction = async (id: string) => {
    const { error } = await createClient().from("transactions").delete().eq("id", id);
    if (error) { toast.error(error.message); return false; }
    setTransactions((items) => items.filter((item) => item.id !== id));
    return true;
  };
  const queryTransactions = useCallback(async (filters: TransactionFilters) => {
    if (!userId) return { data: [], count: 0 };
    const { data, count, error } = await createFinanceService(createClient()).listTransactions(filters);
    if (error) { toast.error("Não foi possível filtrar os lançamentos"); return { data: [], count: 0 }; }
    return { data: data ?? [], count: count ?? 0 };
  }, [userId]);
  const markInvoicePaid = async (cardId: string, referenceMonth: string) => {
    const card = cards.find((item) => item.id === cardId);
    if (!card || !userId) return false;
    const month = new Date(`${referenceMonth}T12:00:00`);
    const dueDate = new Date(month.getFullYear(), month.getMonth(), Math.min(card.due_day, 28)).toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const { data, error } = await createClient().from("card_invoices").upsert({
      user_id: userId, card_id: cardId, reference_month: referenceMonth,
      due_date: dueDate, status: "paid", paid_at: now,
    }, { onConflict: "card_id,reference_month" }).select().single();
    if (error) { toast.error(error.message); return false; }
    setCardInvoices((items) => [data, ...items.filter((item) => item.id !== data.id)]);
    return true;
  };
  const toggleBill = async (id: string) => {
    const bill = recurringBills.find((item) => item.id === id);
    if (!bill || !userId) return false;
    const referenceMonth = `${localMonthKey()}-01`;
    const existing = recurringBillPayments.find((payment) => payment.recurring_bill_id === id && payment.reference_month === referenceMonth);
    const query = existing
      ? createClient().from("recurring_bill_payments").delete().eq("id", existing.id).select().single()
      : createClient().from("recurring_bill_payments").insert({ user_id: userId, recurring_bill_id: id, reference_month: referenceMonth }).select().single();
    const { data, error } = await query;
    if (error) { toast.error(error.message); return false; }
    if (existing) setRecurringBillPayments((items) => items.filter((item) => item.id !== existing.id));
    else setRecurringBillPayments((items) => [...items, data]);
    setRecurringBills((items) => items.map((item) => item.id === id ? { ...item, is_paid: !item.is_paid } : item));
    return true;
  };

  return (
    <FinanceContext.Provider value={{
      currentUser, loading, transactions, accounts, categories, cards, cardInvoices, recurringBills, budgets, goals,
      addTransaction, importTransactions, updateTransaction, deleteTransaction, queryTransactions, addAccount, addBudget, addCategory, addCard,
      addGoal, addRecurringBill, markInvoicePaid, toggleBill,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance deve ser usado dentro de FinanceProvider");
  return context;
}
