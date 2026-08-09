-- MyWealth — import transactions from Money Manager export (Money Manager_8-9-26.xlsx)
-- Step 1/5: accounts + new categories. Jalankan sekali di Supabase SQL Editor,
-- SEBELUM menjalankan file transaksi per tahun (018-021).
--
-- Kategori yang maknanya mirip kategori default sudah digabung ke situ
-- (Food & Beverage->Food, Transport->Transportation, Leisure->Entertainment,
-- Internet Service & Living->Bills, Self Development->Education,
-- Trading->Investment Income, Allowance/Reward/Voucher->Bonus).
-- Sisanya (tidak ada padanan yang cocok) dibuat sebagai kategori baru di bawah ini.

-- Akun (skip yang sudah ada, cocokkan by nama)
with fam as (select id from families limit 1)
insert into accounts (family_id, name, account_group, kind, icon)
select fam.id, v.name, v.account_group, 'asset', 'bi-wallet2'
from fam, (values
  ('Cash',       'Cash & Bank'),
  ('Dana',       'Digital Wallet'),
  ('Gopay',      'Digital Wallet'),
  ('Ovo',        'Digital Wallet'),
  ('Shopeepay',  'Digital Wallet')
) as v(name, account_group)
where not exists (
  select 1 from accounts a where a.family_id = fam.id and a.name = v.name
);

-- Kategori baru (tidak ada padanan yang cocok di kategori default)
with fam as (select id from families limit 1)
insert into categories (family_id, type, name, icon, color_slot)
select fam.id, v.type, v.name, v.icon, v.slot
from fam, (values
  ('expense', 'Supermarket',          'bi-basket',           4),
  ('expense', 'Gifts & Social Life',  'bi-gift',             6),
  ('expense', 'Top Up',               'bi-phone',            7),
  ('expense', 'Family',               'bi-people',           5),
  ('expense', 'House',                'bi-house',            3),
  ('expense', 'Investment',           'bi-graph-up-arrow',   8)
) as v(type, name, icon, slot)
where not exists (
  select 1 from categories c where c.family_id = fam.id and c.type = v.type and c.name = v.name
);
