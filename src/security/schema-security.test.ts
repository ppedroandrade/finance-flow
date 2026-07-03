import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve(process.cwd(), "supabase/migrations/20260703000000_initial_schema.sql"), "utf8").toLowerCase();
const protectedTables = [
  "profiles", "transactions", "categories", "accounts", "cards", "card_invoices",
  "recurring_bills", "recurring_bill_payments", "budgets", "goals",
];

describe("proteções estruturais do schema", () => {
  it.each(protectedTables)("mantém RLS habilitado em %s", (table) => {
    expect(schema).toContain(`alter table public.${table} enable row level security`);
  });

  it.each(protectedTables)("restringe %s ao proprietário autenticado", (table) => {
    const policyPattern = new RegExp(`create policy "[^"]+" on public\\.${table}[\\s\\S]*?to authenticated[\\s\\S]*?public\\.is_app_owner\\(\\)`);
    expect(schema).toMatch(policyPattern);
  });

  it("não expõe a tabela que define o proprietário", () => {
    expect(schema).toContain("revoke all on public.app_owner from anon, authenticated");
  });

  it("remove acesso anônimo de todas as tabelas", () => {
    expect(schema).toContain("revoke all on all tables in schema public from anon");
  });
});
