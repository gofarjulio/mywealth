-- MyWealth — per-month Net Worth Target (replaces the single global target)
-- Jalankan sekali di Supabase SQL Editor.

create table asset_targets (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  year       int not null,
  month      smallint not null check (month between 0 and 11), -- 0=Jan ... 11=Dec
  amount     numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (family_id, year, month)
);

create index on asset_targets (family_id);

alter table asset_targets enable row level security;
create policy "select own asset targets" on asset_targets for select using (family_id = current_family_id());
create policy "insert own asset targets" on asset_targets for insert with check (family_id = current_family_id());
create policy "update own asset targets" on asset_targets for update using (family_id = current_family_id()) with check (family_id = current_family_id());

-- Missed in 009_asset_snapshot_delete.sql: allow editing (not just deleting) an entry's amount.
create policy "update own asset snapshots" on asset_snapshots for update using (family_id = current_family_id()) with check (family_id = current_family_id());

-- Carry the old single global target into the current calendar month so it isn't lost.
insert into asset_targets (family_id, year, month, amount)
select id, extract(year from now())::int, extract(month from now())::int - 1, net_worth_target
from families
where net_worth_target > 0
on conflict (family_id, year, month) do nothing;
