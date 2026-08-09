-- MyWealth — tabel catatan bebas (tidak terikat ke transaksi)
-- Jalankan sekali di Supabase SQL Editor.

create table notes (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  content    text not null,
  created_by uuid references family_members(id) on delete set null,
  created_at timestamptz not null default now()
);

create index on notes (family_id);

alter table notes enable row level security;

create policy "select own notes" on notes for select using (family_id = current_family_id());
create policy "insert own notes" on notes for insert with check (family_id = current_family_id());
create policy "delete own notes" on notes for delete using (family_id = current_family_id());
