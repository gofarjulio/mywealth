-- MyWealth — monthly budget per expense category
-- Jalankan sekali di Supabase SQL Editor.

create table budgets (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  amount      numeric(14, 2) not null default 0,
  created_at  timestamptz not null default now(),
  unique (family_id, category_id)
);

create index on budgets (family_id);

alter table budgets enable row level security;

create policy "select own budgets" on budgets for select using (family_id = current_family_id());
create policy "insert own budgets" on budgets for insert with check (family_id = current_family_id());
create policy "update own budgets" on budgets for update using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "delete own budgets" on budgets for delete using (family_id = current_family_id());
