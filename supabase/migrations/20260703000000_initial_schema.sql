-- Finance Flow — migração inicial para Supabase.
create extension if not exists "pgcrypto";

create type public.transaction_type as enum ('income', 'expense');
create type public.payment_method as enum ('pix', 'credit_card', 'debit_card', 'cash', 'transfer');
create type public.bill_frequency as enum ('weekly', 'monthly', 'quarterly', 'yearly');
create type public.card_brand as enum ('visa', 'mastercard', 'elo', 'other');
create type public.account_type as enum ('checking', 'savings', 'cash', 'investment');
create type public.invoice_status as enum ('open', 'closed', 'paid');

-- Fail-closed: enquanto o proprietário não for configurado, nenhuma tabela financeira pode ser acessada.
create table public.app_owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  require_mfa boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.app_owner enable row level security;
revoke all on public.app_owner from anon, authenticated;

create or replace function public.is_app_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.app_owner
    where user_id = (select auth.uid())
      and (not require_mfa or coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2')
  );
$$;
revoke all on function public.is_app_owner() from public, anon;
grant execute on function public.is_app_owner() to authenticated;

create or replace function public.enable_owner_mfa()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce((select auth.jwt() ->> 'aal'), '') <> 'aal2' then
    raise exception 'AAL2 obrigatório';
  end if;
  update public.app_owner set require_mfa = true where user_id = (select auth.uid());
  if not found then raise exception 'Proprietário inválido'; end if;
end;
$$;
revoke all on function public.enable_owner_mfa() from public, anon;
grant execute on function public.enable_owner_mfa() to authenticated;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 50),
  type public.transaction_type not null,
  icon text not null default 'Shapes',
  color text not null default '#89f0c4',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type public.account_type not null default 'checking',
  institution text,
  initial_balance numeric(12,2) not null default 0,
  color text not null default '#89f0c4',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand public.card_brand not null default 'other',
  last_digits text not null default '0000' check (last_digits ~ '^[0-9]{4}$'),
  limit_amount numeric(12,2) not null check (limit_amount > 0),
  closing_day smallint not null check (closing_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  color text not null default '#7c5cff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.card_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  reference_month date not null check (date_trunc('month', reference_month)::date = reference_month),
  due_date date not null,
  status public.invoice_status not null default 'open',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, reference_month)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  amount numeric(12,2) not null check (amount > 0),
  type public.transaction_type not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  date date not null default current_date,
  payment_method public.payment_method not null,
  account_id uuid references public.accounts(id) on delete set null,
  card_id uuid references public.cards(id) on delete set null,
  invoice_month date,
  installment_group_id uuid,
  installment_number smallint check (installment_number is null or installment_number > 0),
  installment_total smallint check (installment_total is null or installment_total > 0),
  note text check (char_length(note) <= 500),
  import_source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  category_id uuid not null references public.categories(id) on delete restrict,
  due_day smallint not null check (due_day between 1 and 31),
  frequency public.bill_frequency not null default 'monthly',
  next_due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recurring_bill_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_bill_id uuid not null references public.recurring_bills(id) on delete cascade,
  reference_month date not null check (date_trunc('month', reference_month)::date = reference_month),
  paid_at timestamptz not null default now(),
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recurring_bill_id, reference_month)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  monthly_limit numeric(12,2) not null check (monthly_limit > 0),
  alert_percent smallint not null default 80 check (alert_percent between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  deadline date not null,
  icon text not null default 'Target',
  color text not null default '#89f0c4',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions(user_id, date desc);
create index transactions_category_idx on public.transactions(category_id);
create index transactions_account_idx on public.transactions(account_id);
create index transactions_invoice_month_idx on public.transactions(card_id, invoice_month);
create unique index transactions_user_external_id_idx on public.transactions(user_id, external_id) where external_id is not null;
create index recurring_bills_user_due_idx on public.recurring_bills(user_id, next_due_date);
create index cards_user_idx on public.cards(user_id);
create index accounts_user_idx on public.accounts(user_id);
create index budgets_user_idx on public.budgets(user_id);
create index recurring_payments_month_idx on public.recurring_bill_payments(user_id, reference_month);
create index goals_user_idx on public.goals(user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger accounts_updated_at before update on public.accounts for each row execute function public.set_updated_at();
create trigger cards_updated_at before update on public.cards for each row execute function public.set_updated_at();
create trigger card_invoices_updated_at before update on public.card_invoices for each row execute function public.set_updated_at();
create trigger transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger recurring_bills_updated_at before update on public.recurring_bills for each row execute function public.set_updated_at();
create trigger recurring_bill_payments_updated_at before update on public.recurring_bill_payments for each row execute function public.set_updated_at();
create trigger budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();
create trigger goals_updated_at before update on public.goals for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.cards enable row level security;
alter table public.card_invoices enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.recurring_bill_payments enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;

-- Todas as operações exigem simultaneamente o UUID da linha e o UUID único configurado em app_owner.
create policy "profiles_owner_all" on public.profiles for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);
create policy "transactions_owner_all" on public.transactions for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);
create policy "categories_owner_all" on public.categories for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);
create policy "accounts_owner_all" on public.accounts for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);
create policy "cards_owner_all" on public.cards for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);
create policy "card_invoices_owner_all" on public.card_invoices for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);
create policy "recurring_bills_owner_all" on public.recurring_bills for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);
create policy "recurring_payments_owner_all" on public.recurring_bill_payments for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);
create policy "budgets_owner_all" on public.budgets for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);
create policy "goals_owner_all" on public.goals for all to authenticated using (public.is_app_owner() and (select auth.uid()) = user_id) with check (public.is_app_owner() and (select auth.uid()) = user_id);

-- Privilégios explícitos: anon não acessa nenhuma tabela e authenticated ainda depende do RLS.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.transactions,
  public.categories,
  public.accounts,
  public.cards,
  public.card_invoices,
  public.recurring_bills,
  public.recurring_bill_payments,
  public.budgets,
  public.goals
to authenticated;
revoke all on public.app_owner from anon, authenticated;
