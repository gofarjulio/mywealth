-- MyWealth — import Asset data for period July 2026 (as of 25 Jul 2026)
-- Jalankan sekali di Supabase SQL Editor.

-- 1) Pastikan semua akun dari sheet ada (skip yang sudah ada, cocokkan by nama).
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
) as v(name, category)
where not exists (
  select 1 from asset_accounts a where a.family_id = fam.id and a.name = v.name
);

-- 2) Snapshot per 25 Jul 2026 (nilai terakhir/"Last Check" dari sheet;
--    akun dengan tanda "-" di sheet dilewati karena memang belum ada datanya).
with fam as (select id from families limit 1),
acc as (select a.id, a.name from asset_accounts a, fam where a.family_id = fam.id)
insert into asset_snapshots (family_id, asset_account_id, amount, created_at)
select fam.id, acc.id, v.amount, timestamptz '2026-07-25 12:00:00'
from fam, acc, (values
  ('Mandiri',              1613000),
  ('Mandiri (RDI MOST)',   30000),
  ('Permata (Payroll)',    1063000),
  ('Permata (ME)',         122000),
  ('Permata (RDI Ajaib)',  597000),
  ('BCA (+BlubyBCA)',      25424000),
  ('Jago (Main Pocket)',   230000),
  ('Jago (Others Pocket)', 32000),
  ('Jago (Dana Darurat)',  8049000),
  ('Bibit (+Stockbit)',    119216500),
  ('Ajaib',                5914000),
  ('Piutang',              150000)
) as v(name, amount)
where acc.name = v.name;

-- 3) Target Net Worth untuk periode Juli 2026 (month 6 = Juli, 0-indexed).
with fam as (select id from families limit 1)
insert into asset_targets (family_id, year, month, amount)
select fam.id, 2026, 6, 246000000
from fam
on conflict (family_id, year, month) do update set amount = excluded.amount;
