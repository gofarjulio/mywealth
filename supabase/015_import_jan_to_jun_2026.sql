-- MyWealth — import Asset data for periods January-June 2026
-- (Bulan ke-76 s/d ke-81 dari sheet referensi). Jalankan sekali di Supabase SQL Editor.
-- Asumsi: akun sudah ada dari 008_asset_tracker.sql / 014_import_july_2026.sql.

-- 1) Snapshots — satu baris per tanggal aktual di sheet. Untuk tanggal yang
--    muncul dobel di kolom yang sama (14-Jun-26 x2, 26-Mar-26 x2), dipakai
--    nilai kolom terakhir saja (lihat catatan di pesan).
with fam as (select id from families limit 1),
acc as (select a.id, a.name from asset_accounts a, fam where a.family_id = fam.id)
insert into asset_snapshots (family_id, asset_account_id, amount, created_at)
select fam.id, acc.id, v.amount, v.ts
from fam, acc, (values
  -- 25-Jan-26 (periode Januari, Bulan ke-76, cek 1/3)
  ('Mandiri',              609000,    timestamptz '2026-01-25 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-01-25 12:00:00'),
  ('Permata (Payroll)',    17996000,  timestamptz '2026-01-25 12:00:00'),
  ('Permata (ME)',         123000,    timestamptz '2026-01-25 12:00:00'),
  ('Permata (RDI Ajaib)',  4495000,   timestamptz '2026-01-25 12:00:00'),
  ('BCA (+BlubyBCA)',      1121000,   timestamptz '2026-01-25 12:00:00'),
  ('Jago (Main Pocket)',   253000,    timestamptz '2026-01-25 12:00:00'),
  ('Jago (Others Pocket)', 5657000,   timestamptz '2026-01-25 12:00:00'),
  ('Jago (Dana Darurat)',  60149000,  timestamptz '2026-01-25 12:00:00'),
  ('Bibit (+Stockbit)',    167876500, timestamptz '2026-01-25 12:00:00'),
  ('Ajaib',                4581000,   timestamptz '2026-01-25 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-01-25 12:00:00'),

  -- 26-Jan-26 (periode Januari, cek 2/3)
  ('Mandiri',              1109000,   timestamptz '2026-01-26 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-01-26 12:00:00'),
  ('Permata (Payroll)',    1756000,   timestamptz '2026-01-26 12:00:00'),
  ('Permata (ME)',         1123000,   timestamptz '2026-01-26 12:00:00'),
  ('Permata (RDI Ajaib)',  4495000,   timestamptz '2026-01-26 12:00:00'),
  ('BCA (+BlubyBCA)',      13322000,  timestamptz '2026-01-26 12:00:00'),
  ('Jago (Main Pocket)',   253000,    timestamptz '2026-01-26 12:00:00'),
  ('Jago (Others Pocket)', 5657000,   timestamptz '2026-01-26 12:00:00'),
  ('Jago (Dana Darurat)',  60149000,  timestamptz '2026-01-26 12:00:00'),
  ('Bibit (+Stockbit)',    168863000, timestamptz '2026-01-26 12:00:00'),
  ('Ajaib',                4569000,   timestamptz '2026-01-26 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-01-26 12:00:00'),

  -- 22-Feb-26 (periode Januari, cek 3/3 / Last Check)
  ('Mandiri',              54000,     timestamptz '2026-02-22 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-02-22 12:00:00'),
  ('Permata (Payroll)',    93000,     timestamptz '2026-02-22 12:00:00'),
  ('Permata (ME)',         551000,    timestamptz '2026-02-22 12:00:00'),
  ('Permata (RDI Ajaib)',  388000,    timestamptz '2026-02-22 12:00:00'),
  ('BCA (+BlubyBCA)',      13312000,  timestamptz '2026-02-22 12:00:00'),
  ('Jago (Main Pocket)',   106000,    timestamptz '2026-02-22 12:00:00'),
  ('Jago (Others Pocket)', 903000,    timestamptz '2026-02-22 12:00:00'),
  ('Jago (Dana Darurat)',  60289000,  timestamptz '2026-02-22 12:00:00'),
  ('Bibit (+Stockbit)',    161971000, timestamptz '2026-02-22 12:00:00'),
  ('Ajaib',                8893000,   timestamptz '2026-02-22 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-02-22 12:00:00'),

  -- 25-Feb-26 (periode Februari, Bulan ke-77, cek 1/2)
  ('Mandiri',              1054000,   timestamptz '2026-02-25 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-02-25 12:00:00'),
  ('Permata (Payroll)',    1193000,   timestamptz '2026-02-25 12:00:00'),
  ('Permata (ME)',         1051000,   timestamptz '2026-02-25 12:00:00'),
  ('Permata (RDI Ajaib)',  388000,    timestamptz '2026-02-25 12:00:00'),
  ('BCA (+BlubyBCA)',      13312000,  timestamptz '2026-02-25 12:00:00'),
  ('Jago (Main Pocket)',   4606000,   timestamptz '2026-02-25 12:00:00'),
  ('Jago (Others Pocket)', 903000,    timestamptz '2026-02-25 12:00:00'),
  ('Jago (Dana Darurat)',  60289000,  timestamptz '2026-02-25 12:00:00'),
  ('Bibit (+Stockbit)',    164351500, timestamptz '2026-02-25 12:00:00'),
  ('Ajaib',                8615000,   timestamptz '2026-02-25 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-02-25 12:00:00'),

  -- 08-Mar-26 (periode Februari, cek 2/2 / Last Check)
  ('Mandiri',              840000,    timestamptz '2026-03-08 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-03-08 12:00:00'),
  ('Permata (Payroll)',    9222000,   timestamptz '2026-03-08 12:00:00'),
  ('Permata (ME)',         953000,    timestamptz '2026-03-08 12:00:00'),
  ('Permata (RDI Ajaib)',  388000,    timestamptz '2026-03-08 12:00:00'),
  ('BCA (+BlubyBCA)',      13313000,  timestamptz '2026-03-08 12:00:00'),
  ('Jago (Main Pocket)',   3709000,   timestamptz '2026-03-08 12:00:00'),
  ('Jago (Others Pocket)', 682000,    timestamptz '2026-03-08 12:00:00'),
  ('Jago (Dana Darurat)',  40423000,  timestamptz '2026-03-08 12:00:00'),
  ('Bibit (+Stockbit)',    163918500, timestamptz '2026-03-08 12:00:00'),
  ('Ajaib',                7633000,   timestamptz '2026-03-08 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-03-08 12:00:00'),

  -- 26-Mar-26 (periode Maret, Bulan ke-78, cek 1/2 — nilai kolom terakhir dari 2 entri di tgl sama)
  ('Mandiri',              1733000,   timestamptz '2026-03-26 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-03-26 12:00:00'),
  ('Permata (Payroll)',    1088000,   timestamptz '2026-03-26 12:00:00'),
  ('Permata (ME)',         1128000,   timestamptz '2026-03-26 12:00:00'),
  ('Permata (RDI Ajaib)',  388000,    timestamptz '2026-03-26 12:00:00'),
  ('BCA (+BlubyBCA)',      13303000,  timestamptz '2026-03-26 12:00:00'),
  ('Jago (Main Pocket)',   30000,     timestamptz '2026-03-26 12:00:00'),
  ('Jago (Others Pocket)', 43374000,  timestamptz '2026-03-26 12:00:00'),
  ('Jago (Dana Darurat)',  10423000,  timestamptz '2026-03-26 12:00:00'),
  ('Bibit (+Stockbit)',    160623500, timestamptz '2026-03-26 12:00:00'),
  ('Ajaib',                7179000,   timestamptz '2026-03-26 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-03-26 12:00:00'),

  -- 08-Apr-26 (periode Maret, cek 2/2 / Last Check)
  ('Mandiri',              237000,    timestamptz '2026-04-08 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-04-08 12:00:00'),
  ('Permata (Payroll)',    1055000,   timestamptz '2026-04-08 12:00:00'),
  ('Permata (ME)',         1023000,   timestamptz '2026-04-08 12:00:00'),
  ('Permata (RDI Ajaib)',  388000,    timestamptz '2026-04-08 12:00:00'),
  ('BCA (+BlubyBCA)',      13345000,  timestamptz '2026-04-08 12:00:00'),
  ('Jago (Main Pocket)',   1000,      timestamptz '2026-04-08 12:00:00'),
  ('Jago (Others Pocket)', 35309000,  timestamptz '2026-04-08 12:00:00'),
  ('Jago (Dana Darurat)',  10498000,  timestamptz '2026-04-08 12:00:00'),
  ('Bibit (+Stockbit)',    158172000, timestamptz '2026-04-08 12:00:00'),
  ('Ajaib',                7676000,   timestamptz '2026-04-08 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-04-08 12:00:00'),

  -- 29-Apr-26 (periode April, Bulan ke-79)
  ('Mandiri',              1096000,   timestamptz '2026-04-29 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-04-29 12:00:00'),
  ('Permata (Payroll)',    1800000,   timestamptz '2026-04-29 12:00:00'),
  ('Permata (ME)',         2352000,   timestamptz '2026-04-29 12:00:00'),
  ('Permata (RDI Ajaib)',  388000,    timestamptz '2026-04-29 12:00:00'),
  ('BCA (+BlubyBCA)',      18246000,  timestamptz '2026-04-29 12:00:00'),
  ('Jago (Main Pocket)',   1000,      timestamptz '2026-04-29 12:00:00'),
  ('Jago (Others Pocket)', 3546000,   timestamptz '2026-04-29 12:00:00'),
  ('Jago (Dana Darurat)',  10521000,  timestamptz '2026-04-29 12:00:00'),
  ('Bibit (+Stockbit)',    153287500, timestamptz '2026-04-29 12:00:00'),
  ('Ajaib',                7032000,   timestamptz '2026-04-29 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-04-29 12:00:00'),

  -- 14-Jun-26 (periode Mei, Bulan ke-80 — nilai kolom terakhir dari 2 entri di tgl sama)
  ('Mandiri',              3806000,   timestamptz '2026-06-14 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-06-14 12:00:00'),
  ('Permata (Payroll)',    2050000,   timestamptz '2026-06-14 12:00:00'),
  ('Permata (ME)',         1876000,   timestamptz '2026-06-14 12:00:00'),
  ('Permata (RDI Ajaib)',  597000,    timestamptz '2026-06-14 12:00:00'),
  ('BCA (+BlubyBCA)',      33874000,  timestamptz '2026-06-14 12:00:00'),
  ('Jago (Main Pocket)',   43000,     timestamptz '2026-06-14 12:00:00'),
  ('Jago (Others Pocket)', 1351000,   timestamptz '2026-06-14 12:00:00'),
  ('Jago (Dana Darurat)',  4039000,   timestamptz '2026-06-14 12:00:00'),
  ('Bibit (+Stockbit)',    115735000, timestamptz '2026-06-14 12:00:00'),
  ('Ajaib',                5566000,   timestamptz '2026-06-14 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-06-14 12:00:00'),

  -- 01-Jul-26 (periode Juni, Bulan ke-81)
  ('Mandiri',              1033000,   timestamptz '2026-07-01 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-07-01 12:00:00'),
  ('Permata (Payroll)',    5291000,   timestamptz '2026-07-01 12:00:00'),
  ('Permata (ME)',         122000,    timestamptz '2026-07-01 12:00:00'),
  ('Permata (RDI Ajaib)',  597000,    timestamptz '2026-07-01 12:00:00'),
  ('BCA (+BlubyBCA)',      26384000,  timestamptz '2026-07-01 12:00:00'),
  ('Jago (Main Pocket)',   26000,     timestamptz '2026-07-01 12:00:00'),
  ('Jago (Others Pocket)', 32000,     timestamptz '2026-07-01 12:00:00'),
  ('Jago (Dana Darurat)',  4049000,   timestamptz '2026-07-01 12:00:00'),
  ('Bibit (+Stockbit)',    110848500, timestamptz '2026-07-01 12:00:00'),
  ('Ajaib',                5011000,   timestamptz '2026-07-01 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-07-01 12:00:00')
) as v(name, amount, ts)
where acc.name = v.name;

-- 2) Target Net Worth per periode (month: 0=Jan ... 11=Dec).
with fam as (select id from families limit 1)
insert into asset_targets (family_id, year, month, amount)
select fam.id, v.year, v.month, v.amount
from fam, (values
  (2026, 0, 228000000), -- Januari
  (2026, 1, 231000000), -- Februari
  (2026, 2, 234000000), -- Maret
  (2026, 3, 237000000), -- April
  (2026, 4, 240000000), -- Mei
  (2026, 5, 243000000)  -- Juni
) as v(year, month, amount)
on conflict (family_id, year, month) do update set amount = excluded.amount;
