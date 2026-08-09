-- MyWealth — standalone net worth / asset tracker
-- Independent from accounts/transactions: a manually-updated log of
-- account values over time, used only by the new "Asset" page.
-- Jalankan sekali di Supabase SQL Editor.

create table asset_accounts (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  name       text not null,
  category   text not null check (category in ('cash', 'investment', 'fixed', 'debt_short', 'debt_long')),
  created_at timestamptz not null default now()
);

create table asset_snapshots (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families(id) on delete cascade,
  asset_account_id uuid not null references asset_accounts(id) on delete cascade,
  amount          numeric(14, 2) not null default 0,
  created_by      uuid references family_members(id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table families add column if not exists net_worth_target numeric(14, 2) not null default 0;

create index on asset_accounts (family_id);
create index on asset_snapshots (family_id);
create index on asset_snapshots (asset_account_id);

alter table asset_accounts enable row level security;
alter table asset_snapshots enable row level security;

create policy "select own asset accounts" on asset_accounts for select using (family_id = current_family_id());
create policy "insert own asset accounts" on asset_accounts for insert with check (family_id = current_family_id());
create policy "delete own asset accounts" on asset_accounts for delete using (family_id = current_family_id());

create policy "select own asset snapshots" on asset_snapshots for select using (family_id = current_family_id());
create policy "insert own asset snapshots" on asset_snapshots for insert with check (family_id = current_family_id());

-- Seed: accounts from your reference sheet (edit/add more later from the Update tab)
with fam as (select id from families limit 1)
insert into asset_accounts (family_id, name, category)
select fam.id, v.name, v.category
from fam, (values
  ('Mandiri',              'cash'),
  ('Mandiri (RDI MOST)',   'investment'),
  ('Permata (Payroll)',    'cash'),
  ('Permata (ME)',         'cash'),
  ('Permata (RDI Ajaib)',  'investment'),
  ('Permata (RDI IPOT)',   'investment'),
  ('BNI',                  'cash'),
  ('BNI (KTM)',            'cash'),
  ('BCA (+BlubyBCA)',      'investment'),
  ('Jago (Main Pocket)',   'cash'),
  ('Jago (Others Pocket)', 'cash'),
  ('Jago (Dana Darurat)',  'investment'),
  ('Tokopedia Emas',       'investment'),
  ('Bibit (+Stockbit)',    'investment'),
  ('Ajaib',                'investment'),
  ('IPOT',                 'investment'),
  ('MOST',                 'investment'),
  ('Binance',              'investment'),
  ('Pintu',                'investment'),
  ('Piutang',              'cash')
) as v(name, category);
