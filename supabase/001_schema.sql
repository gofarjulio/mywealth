-- MyWealth — struktur database Supabase (Postgres)
-- Jalankan file ini sekali di: Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists pgcrypto;

-- ================================================================
-- Tabel inti
-- ================================================================

create table families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Keluarga Saya',
  created_at timestamptz not null default now()
);

create table family_members (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  email        text,
  name         text not null,
  role         text not null default 'Anggota',
  initials     text not null default '??',
  created_at   timestamptz not null default now()
);

create table categories (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  type       text not null check (type in ('expense', 'income')),
  name       text not null,
  icon       text not null default 'bi-tag',
  color_slot smallint not null default 1 check (color_slot between 1 and 8),
  created_at timestamptz not null default now()
);

create table accounts (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families(id) on delete cascade,
  name            text not null,
  account_group   text not null,
  kind            text not null check (kind in ('asset', 'liability')),
  icon            text not null default 'bi-wallet2',
  opening_balance numeric(14, 2) not null default 0,
  created_at      timestamptz not null default now()
);

create table transactions (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  tx_date       date not null,
  tx_time       time not null default '00:00',
  type          text not null check (type in ('income', 'expense', 'transfer', 'adjustment')),
  amount        numeric(14, 2) not null,
  category_id   uuid references categories(id) on delete set null,
  account_id    uuid not null references accounts(id) on delete cascade,
  to_account_id uuid references accounts(id) on delete cascade,
  note          text not null default '',
  created_by    uuid references family_members(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index on family_members (family_id);
create index on categories (family_id);
create index on accounts (family_id);
create index on transactions (family_id);
create index on transactions (account_id);
create index on transactions (to_account_id);

-- ================================================================
-- Saldo akun dihitung otomatis dari riwayat transaksi (bukan kolom
-- yang diubah manual) — jadi tidak akan pernah "meleset" walau
-- diakses dari beberapa perangkat bersamaan.
-- ================================================================

create view account_balances
with (security_invoker = true) as
select
  a.id as account_id,
  a.family_id,
  a.opening_balance + coalesce(net.delta, 0) as balance
from accounts a
left join (
  select account_id, sum(delta) as delta
  from (
    select account_id,
      case
        when type = 'income'      then amount
        when type = 'expense'     then -amount
        when type = 'transfer'    then -amount
        when type = 'adjustment'  then amount
      end as delta
    from transactions
    union all
    select to_account_id as account_id, amount as delta
    from transactions
    where type = 'transfer' and to_account_id is not null
  ) effects
  group by account_id
) net on net.account_id = a.id;

-- ================================================================
-- Row Level Security — tiap keluarga hanya bisa melihat/mengubah
-- datanya sendiri.
-- ================================================================

create or replace function current_family_id()
returns uuid
language sql
security definer
stable
as $$
  select family_id from family_members where auth_user_id = auth.uid() limit 1;
$$;

alter table families enable row level security;
alter table family_members enable row level security;
alter table categories enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;

create policy "select own family" on families for select using (id = current_family_id());
create policy "update own family" on families for update using (id = current_family_id()) with check (id = current_family_id());

create policy "select own members" on family_members for select using (family_id = current_family_id());
create policy "insert own members" on family_members for insert with check (family_id = current_family_id());
create policy "update own members" on family_members for update using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "delete own members" on family_members for delete using (family_id = current_family_id());

create policy "select own categories" on categories for select using (family_id = current_family_id());
create policy "insert own categories" on categories for insert with check (family_id = current_family_id());
create policy "update own categories" on categories for update using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "delete own categories" on categories for delete using (family_id = current_family_id());

create policy "select own accounts" on accounts for select using (family_id = current_family_id());
create policy "insert own accounts" on accounts for insert with check (family_id = current_family_id());
create policy "update own accounts" on accounts for update using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "delete own accounts" on accounts for delete using (family_id = current_family_id());

create policy "select own transactions" on transactions for select using (family_id = current_family_id());
create policy "insert own transactions" on transactions for insert with check (family_id = current_family_id());
create policy "update own transactions" on transactions for update using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "delete own transactions" on transactions for delete using (family_id = current_family_id());
