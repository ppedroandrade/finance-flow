-- Separa o valor oficial da fatura do limite total utilizado no cartão.
alter table public.cards
  add column if not exists used_limit_amount numeric(12,2),
  add column if not exists limit_updated_at timestamptz;

alter table public.card_invoices
  add column if not exists statement_amount numeric(12,2),
  add column if not exists paid_amount numeric(12,2) not null default 0;

alter table public.cards
  add constraint cards_used_limit_amount_check
  check (used_limit_amount is null or used_limit_amount >= 0);

alter table public.card_invoices
  add constraint card_invoices_statement_amount_check
  check (statement_amount is null or statement_amount >= 0),
  add constraint card_invoices_paid_amount_check
  check (paid_amount >= 0);
