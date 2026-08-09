-- MyWealth — import Asset data for periods December 2024 - December 2025
-- (Bulan ke-63 s/d ke-75 dari sheet referensi). Jalankan sekali di Supabase SQL Editor.
--
-- Catatan interpretasi (lihat penjelasan lengkap di chat):
--  - BCA (+BlubyBCA) dianggap kosong (dash) untuk seluruh Des 2024 - Mei 2025
--    (ke-63 s/d ke-68); checksum "Fixed Asset" di sheet cuma cocok begitu.
--  - "Jago (Kurban & Piano)" (nama lama) dipetakan ke akun "Jago (Others Pocket)"
--    yang sudah ada; "Jago (Term Deposit)" (nama lama) dipetakan ke akun
--    "Jago (Dana Darurat)" yang sudah ada — nilainya nyambung persis di titik
--    pergantian nama, jadi akun yang sama, bukan akun baru.

with fam as (select id from families limit 1),
acc as (select a.id, a.name from asset_accounts a, fam where a.family_id = fam.id)
insert into asset_snapshots (family_id, asset_account_id, amount, created_at)
select fam.id, acc.id, v.amount, v.ts
from fam, acc, (values
  -- 24-Dec-24 (periode Desember 2024, Bulan ke-63, cek 1/3 — nilai kolom terakhir dari 2 entri tgl sama)
  ('Mandiri',              2395000,   timestamptz '2024-12-24 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2024-12-24 12:00:00'),
  ('Permata (Payroll)',    1253000,   timestamptz '2024-12-24 12:00:00'),
  ('Permata (ME)',         11978000,  timestamptz '2024-12-24 12:00:00'),
  ('Permata (RDI Ajaib)',  1507000,   timestamptz '2024-12-24 12:00:00'),
  ('Jago (Main Pocket)',   509000,    timestamptz '2024-12-24 12:00:00'),
  ('Bibit (+Stockbit)',    152963000, timestamptz '2024-12-24 12:00:00'),
  ('Ajaib',                13529000,  timestamptz '2024-12-24 12:00:00'),

  -- 05-Jan-25 (periode Desember 2024, cek 2/3)
  ('Mandiri',              1746000,   timestamptz '2025-01-05 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-01-05 12:00:00'),
  ('Permata (Payroll)',    745000,    timestamptz '2025-01-05 12:00:00'),
  ('Permata (ME)',         583000,    timestamptz '2025-01-05 12:00:00'),
  ('Permata (RDI Ajaib)',  1507000,   timestamptz '2025-01-05 12:00:00'),
  ('Jago (Main Pocket)',   20000,     timestamptz '2025-01-05 12:00:00'),
  ('Bibit (+Stockbit)',    152791000, timestamptz '2025-01-05 12:00:00'),
  ('Ajaib',                13612000,  timestamptz '2025-01-05 12:00:00'),

  -- 18-Jan-25 (periode Desember 2024, cek 3/3 / Last Check)
  ('Mandiri',              132000,    timestamptz '2025-01-18 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-01-18 12:00:00'),
  ('Permata (Payroll)',    1051000,   timestamptz '2025-01-18 12:00:00'),
  ('Permata (ME)',         4083000,   timestamptz '2025-01-18 12:00:00'),
  ('Permata (RDI Ajaib)',  1642000,   timestamptz '2025-01-18 12:00:00'),
  ('Jago (Main Pocket)',   356000,    timestamptz '2025-01-18 12:00:00'),
  ('Bibit (+Stockbit)',    154607000, timestamptz '2025-01-18 12:00:00'),
  ('Ajaib',                13527000,  timestamptz '2025-01-18 12:00:00'),
  ('Piutang',              650000,    timestamptz '2025-01-18 12:00:00'),

  -- 31-Jan-25 (periode Januari 2025, Bulan ke-64)
  ('Mandiri',              1081000,   timestamptz '2025-01-31 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-01-31 12:00:00'),
  ('Permata (Payroll)',    1005000,   timestamptz '2025-01-31 12:00:00'),
  ('Permata (ME)',         1473000,   timestamptz '2025-01-31 12:00:00'),
  ('Permata (RDI Ajaib)',  167000,    timestamptz '2025-01-31 12:00:00'),
  ('Jago (Main Pocket)',   32000,     timestamptz '2025-01-31 12:00:00'),
  ('Bibit (+Stockbit)',    161740000, timestamptz '2025-01-31 12:00:00'),
  ('Ajaib',                14831000,  timestamptz '2025-01-31 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-01-31 12:00:00'),

  -- 09-Mar-25 (periode Februari 2025, Bulan ke-65)
  ('Mandiri',              485000,    timestamptz '2025-03-09 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-03-09 12:00:00'),
  ('Permata (Payroll)',    85000,     timestamptz '2025-03-09 12:00:00'),
  ('Permata (ME)',         75000,     timestamptz '2025-03-09 12:00:00'),
  ('Permata (RDI Ajaib)',  167000,    timestamptz '2025-03-09 12:00:00'),
  ('Jago (Main Pocket)',   5000,      timestamptz '2025-03-09 12:00:00'),
  ('Bibit (+Stockbit)',    158732000, timestamptz '2025-03-09 12:00:00'),
  ('Ajaib',                14703000,  timestamptz '2025-03-09 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-03-09 12:00:00'),

  -- 09-Apr-25 (periode Maret 2025, Bulan ke-66, cek 1/2)
  ('Mandiri',              900000,    timestamptz '2025-04-09 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-04-09 12:00:00'),
  ('Permata (Payroll)',    256000,    timestamptz '2025-04-09 12:00:00'),
  ('Permata (ME)',         237000,    timestamptz '2025-04-09 12:00:00'),
  ('Permata (RDI Ajaib)',  167000,    timestamptz '2025-04-09 12:00:00'),
  ('Jago (Main Pocket)',   8000,      timestamptz '2025-04-09 12:00:00'),
  ('Bibit (+Stockbit)',    158664000, timestamptz '2025-04-09 12:00:00'),
  ('Ajaib',                13838000,  timestamptz '2025-04-09 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-04-09 12:00:00'),

  -- 22-Apr-25 (periode Maret 2025, cek 2/2 / Last Check)
  ('Mandiri',              804000,    timestamptz '2025-04-22 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-04-22 12:00:00'),
  ('Permata (Payroll)',    256000,    timestamptz '2025-04-22 12:00:00'),
  ('Permata (ME)',         220000,    timestamptz '2025-04-22 12:00:00'),
  ('Permata (RDI Ajaib)',  167000,    timestamptz '2025-04-22 12:00:00'),
  ('Jago (Main Pocket)',   115000,    timestamptz '2025-04-22 12:00:00'),
  ('Bibit (+Stockbit)',    147544000, timestamptz '2025-04-22 12:00:00'),
  ('Ajaib',                14106000,  timestamptz '2025-04-22 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-04-22 12:00:00'),

  -- 02-May-25 (periode April 2025, Bulan ke-67, cek 1/2)
  ('Mandiri',              991000,    timestamptz '2025-05-02 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-05-02 12:00:00'),
  ('Permata (Payroll)',    1187000,   timestamptz '2025-05-02 12:00:00'),
  ('Permata (ME)',         1562000,   timestamptz '2025-05-02 12:00:00'),
  ('Permata (RDI Ajaib)',  375000,    timestamptz '2025-05-02 12:00:00'),
  ('Jago (Main Pocket)',   65000,     timestamptz '2025-05-02 12:00:00'),
  ('Bibit (+Stockbit)',    159098000, timestamptz '2025-05-02 12:00:00'),
  ('Ajaib',                14468000,  timestamptz '2025-05-02 12:00:00'),
  ('Piutang',              650000,    timestamptz '2025-05-02 12:00:00'),

  -- 08-May-25 (periode April 2025, cek 2/2 / Last Check)
  ('Mandiri',              299000,    timestamptz '2025-05-08 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-05-08 12:00:00'),
  ('Permata (Payroll)',    1187000,   timestamptz '2025-05-08 12:00:00'),
  ('Permata (ME)',         292000,    timestamptz '2025-05-08 12:00:00'),
  ('Permata (RDI Ajaib)',  375000,    timestamptz '2025-05-08 12:00:00'),
  ('Jago (Main Pocket)',   474000,    timestamptz '2025-05-08 12:00:00'),
  ('Bibit (+Stockbit)',    157036000, timestamptz '2025-05-08 12:00:00'),
  ('Ajaib',                14356000,  timestamptz '2025-05-08 12:00:00'),
  ('Piutang',              650000,    timestamptz '2025-05-08 12:00:00'),

  -- 23-May-25 (periode Mei 2025, Bulan ke-68, cek 1/3)
  ('Mandiri',              1003000,   timestamptz '2025-05-23 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-05-23 12:00:00'),
  ('Permata (Payroll)',    9257000,   timestamptz '2025-05-23 12:00:00'),
  ('Permata (ME)',         191000,    timestamptz '2025-05-23 12:00:00'),
  ('Permata (RDI Ajaib)',  375000,    timestamptz '2025-05-23 12:00:00'),
  ('Jago (Main Pocket)',   453000,    timestamptz '2025-05-23 12:00:00'),
  ('Bibit (+Stockbit)',    165274000, timestamptz '2025-05-23 12:00:00'),
  ('Ajaib',                14828000,  timestamptz '2025-05-23 12:00:00'),
  ('Piutang',              650000,    timestamptz '2025-05-23 12:00:00'),

  -- 29-May-25 (periode Mei 2025, cek 2/3)
  ('Mandiri',              1003000,   timestamptz '2025-05-29 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-05-29 12:00:00'),
  ('Permata (Payroll)',    1127000,   timestamptz '2025-05-29 12:00:00'),
  ('Permata (ME)',         1001000,   timestamptz '2025-05-29 12:00:00'),
  ('Permata (RDI Ajaib)',  375000,    timestamptz '2025-05-29 12:00:00'),
  ('Jago (Main Pocket)',   6139000,   timestamptz '2025-05-29 12:00:00'),
  ('Bibit (+Stockbit)',    166860000, timestamptz '2025-05-29 12:00:00'),
  ('Ajaib',                15170000,  timestamptz '2025-05-29 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-05-29 12:00:00'),

  -- 06-Jun-25 (periode Mei 2025, cek 3/3 / Last Check)
  ('Mandiri',              1304000,   timestamptz '2025-06-06 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-06-06 12:00:00'),
  ('Permata (Payroll)',    854000,    timestamptz '2025-06-06 12:00:00'),
  ('Permata (ME)',         501000,    timestamptz '2025-06-06 12:00:00'),
  ('Permata (RDI Ajaib)',  1053000,   timestamptz '2025-06-06 12:00:00'),
  ('Jago (Main Pocket)',   88000,     timestamptz '2025-06-06 12:00:00'),
  ('Bibit (+Stockbit)',    168149000, timestamptz '2025-06-06 12:00:00'),
  ('Ajaib',                14292000,  timestamptz '2025-06-06 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-06-06 12:00:00'),

  -- 25-Jun-25 (periode Juni 2025, Bulan ke-69, cek 1/2 — nilai kolom terakhir dari 2 entri tgl sama)
  ('Mandiri',              1256000,   timestamptz '2025-06-25 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-06-25 12:00:00'),
  ('Permata (Payroll)',    569000,    timestamptz '2025-06-25 12:00:00'),
  ('Permata (ME)',         1354000,   timestamptz '2025-06-25 12:00:00'),
  ('Permata (RDI Ajaib)',  1053000,   timestamptz '2025-06-25 12:00:00'),
  ('BCA (+BlubyBCA)',      10131000,  timestamptz '2025-06-25 12:00:00'),
  ('Jago (Main Pocket)',   5088000,   timestamptz '2025-06-25 12:00:00'),
  ('Bibit (+Stockbit)',    150607000, timestamptz '2025-06-25 12:00:00'),
  ('Ajaib',                13644000,  timestamptz '2025-06-25 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-06-25 12:00:00'),

  -- 23-Jul-25 (periode Juni 2025, cek 2/2 / Last Check)
  ('Mandiri',              75000,     timestamptz '2025-07-23 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-07-23 12:00:00'),
  ('Permata (Payroll)',    127000,    timestamptz '2025-07-23 12:00:00'),
  ('Permata (ME)',         625000,    timestamptz '2025-07-23 12:00:00'),
  ('Permata (RDI Ajaib)',  1053000,   timestamptz '2025-07-23 12:00:00'),
  ('BCA (+BlubyBCA)',      10121000,  timestamptz '2025-07-23 12:00:00'),
  ('Jago (Main Pocket)',   1868000,   timestamptz '2025-07-23 12:00:00'),
  ('Bibit (+Stockbit)',    155288000, timestamptz '2025-07-23 12:00:00'),
  ('Ajaib',                14741000,  timestamptz '2025-07-23 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-07-23 12:00:00'),

  -- 25-Jul-25 (periode Juli 2025, Bulan ke-70, cek 1/2)
  ('Mandiri',              1075000,   timestamptz '2025-07-25 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-07-25 12:00:00'),
  ('Permata (Payroll)',    1012000,   timestamptz '2025-07-25 12:00:00'),
  ('Permata (ME)',         2035000,   timestamptz '2025-07-25 12:00:00'),
  ('Permata (RDI Ajaib)',  1053000,   timestamptz '2025-07-25 12:00:00'),
  ('BCA (+BlubyBCA)',      10121000,  timestamptz '2025-07-25 12:00:00'),
  ('Jago (Main Pocket)',   174000,    timestamptz '2025-07-25 12:00:00'),
  ('Bibit (+Stockbit)',    166682000, timestamptz '2025-07-25 12:00:00'),
  ('Ajaib',                14932000,  timestamptz '2025-07-25 12:00:00'),
  ('Piutang',              650000,    timestamptz '2025-07-25 12:00:00'),

  -- 20-Aug-25 (periode Juli 2025, cek 2/2 / Last Check)
  ('Mandiri',              399000,    timestamptz '2025-08-20 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-08-20 12:00:00'),
  ('Permata (Payroll)',    205000,    timestamptz '2025-08-20 12:00:00'),
  ('Permata (ME)',         594000,    timestamptz '2025-08-20 12:00:00'),
  ('Permata (RDI Ajaib)',  1053000,   timestamptz '2025-08-20 12:00:00'),
  ('BCA (+BlubyBCA)',      109000,    timestamptz '2025-08-20 12:00:00'),
  ('Jago (Main Pocket)',   241000,    timestamptz '2025-08-20 12:00:00'),
  ('Jago (Dana Darurat)',  20000000,  timestamptz '2025-08-20 12:00:00'),
  ('Bibit (+Stockbit)',    160922000, timestamptz '2025-08-20 12:00:00'),
  ('Ajaib',                16358000,  timestamptz '2025-08-20 12:00:00'),
  ('Piutang',              650000,    timestamptz '2025-08-20 12:00:00'),

  -- 26-Aug-25 (periode Agustus 2025, Bulan ke-71, cek 1/2)
  ('Mandiri',              422000,    timestamptz '2025-08-26 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-08-26 12:00:00'),
  ('Permata (Payroll)',    5363000,   timestamptz '2025-08-26 12:00:00'),
  ('Permata (ME)',         339000,    timestamptz '2025-08-26 12:00:00'),
  ('Permata (RDI Ajaib)',  1053000,   timestamptz '2025-08-26 12:00:00'),
  ('BCA (+BlubyBCA)',      109000,    timestamptz '2025-08-26 12:00:00'),
  ('Jago (Main Pocket)',   113000,    timestamptz '2025-08-26 12:00:00'),
  ('Jago (Others Pocket)', 500000,    timestamptz '2025-08-26 12:00:00'),
  ('Jago (Dana Darurat)',  20000000,  timestamptz '2025-08-26 12:00:00'),
  ('Bibit (+Stockbit)',    166490500, timestamptz '2025-08-26 12:00:00'),
  ('Ajaib',                16599000,  timestamptz '2025-08-26 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-08-26 12:00:00'),

  -- 24-Sep-25 (periode Agustus 2025, cek 2/2 / Last Check)
  ('Mandiri',              251000,    timestamptz '2025-09-24 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-09-24 12:00:00'),
  ('Permata (Payroll)',    120000,    timestamptz '2025-09-24 12:00:00'),
  ('Permata (ME)',         532000,    timestamptz '2025-09-24 12:00:00'),
  ('Permata (RDI Ajaib)',  1054000,   timestamptz '2025-09-24 12:00:00'),
  ('Jago (Main Pocket)',   405000,    timestamptz '2025-09-24 12:00:00'),
  ('Jago (Dana Darurat)',  20000000,  timestamptz '2025-09-24 12:00:00'),
  ('Bibit (+Stockbit)',    163317500, timestamptz '2025-09-24 12:00:00'),
  ('Ajaib',                16828000,  timestamptz '2025-09-24 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-09-24 12:00:00'),

  -- 25-Sep-25 (periode September 2025, Bulan ke-72, cek 1/2 — nilai kolom terakhir dari 2 entri tgl sama)
  ('Mandiri',              1251000,   timestamptz '2025-09-25 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-09-25 12:00:00'),
  ('Permata (Payroll)',    1716000,   timestamptz '2025-09-25 12:00:00'),
  ('Permata (ME)',         1522000,   timestamptz '2025-09-25 12:00:00'),
  ('Permata (RDI Ajaib)',  1054000,   timestamptz '2025-09-25 12:00:00'),
  ('BCA (+BlubyBCA)',      1099000,   timestamptz '2025-09-25 12:00:00'),
  ('Jago (Main Pocket)',   1405000,   timestamptz '2025-09-25 12:00:00'),
  ('Jago (Dana Darurat)',  20000000,  timestamptz '2025-09-25 12:00:00'),
  ('Bibit (+Stockbit)',    166292000, timestamptz '2025-09-25 12:00:00'),
  ('Ajaib',                16828000,  timestamptz '2025-09-25 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-09-25 12:00:00'),

  -- 16-Oct-25 (periode September 2025, cek 2/2 / Last Check)
  ('Mandiri',              238000,    timestamptz '2025-10-16 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-10-16 12:00:00'),
  ('Permata (Payroll)',    317000,    timestamptz '2025-10-16 12:00:00'),
  ('Permata (ME)',         1021000,   timestamptz '2025-10-16 12:00:00'),
  ('Permata (RDI Ajaib)',  1054000,   timestamptz '2025-10-16 12:00:00'),
  ('BCA (+BlubyBCA)',      1099000,   timestamptz '2025-10-16 12:00:00'),
  ('Jago (Main Pocket)',   230000,    timestamptz '2025-10-16 12:00:00'),
  ('Jago (Dana Darurat)',  20000000,  timestamptz '2025-10-16 12:00:00'),
  ('Bibit (+Stockbit)',    153921000, timestamptz '2025-10-16 12:00:00'),
  ('Ajaib',                16233000,  timestamptz '2025-10-16 12:00:00'),
  ('Piutang',              1150000,   timestamptz '2025-10-16 12:00:00'),

  -- 25-Oct-25 (periode Oktober 2025, Bulan ke-73, cek 1/2)
  ('Mandiri',              1537000,   timestamptz '2025-10-25 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-10-25 12:00:00'),
  ('Permata (Payroll)',    1303000,   timestamptz '2025-10-25 12:00:00'),
  ('Permata (ME)',         4009000,   timestamptz '2025-10-25 12:00:00'),
  ('Permata (RDI Ajaib)',  14705000,  timestamptz '2025-10-25 12:00:00'),
  ('BCA (+BlubyBCA)',      1089000,   timestamptz '2025-10-25 12:00:00'),
  ('Jago (Main Pocket)',   127000,    timestamptz '2025-10-25 12:00:00'),
  ('Jago (Others Pocket)', 1000000,   timestamptz '2025-10-25 12:00:00'),
  ('Jago (Dana Darurat)',  20000000,  timestamptz '2025-10-25 12:00:00'),
  ('Bibit (+Stockbit)',    169584500, timestamptz '2025-10-25 12:00:00'),
  ('Ajaib',                3902000,   timestamptz '2025-10-25 12:00:00'),
  ('Piutang',              1150000,   timestamptz '2025-10-25 12:00:00'),

  -- 09-Nov-25 (periode Oktober 2025, cek 2/2 / Last Check)
  ('Mandiri',              693000,    timestamptz '2025-11-09 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-11-09 12:00:00'),
  ('Permata (Payroll)',    1140000,   timestamptz '2025-11-09 12:00:00'),
  ('Permata (ME)',         1268000,   timestamptz '2025-11-09 12:00:00'),
  ('Permata (RDI Ajaib)',  14922000,  timestamptz '2025-11-09 12:00:00'),
  ('BCA (+BlubyBCA)',      1089000,   timestamptz '2025-11-09 12:00:00'),
  ('Jago (Main Pocket)',   288000,    timestamptz '2025-11-09 12:00:00'),
  ('Jago (Others Pocket)', 1000000,   timestamptz '2025-11-09 12:00:00'),
  ('Jago (Dana Darurat)',  20000000,  timestamptz '2025-11-09 12:00:00'),
  ('Bibit (+Stockbit)',    171769000, timestamptz '2025-11-09 12:00:00'),
  ('Ajaib',                4033000,   timestamptz '2025-11-09 12:00:00'),
  ('Piutang',              1150000,   timestamptz '2025-11-09 12:00:00'),

  -- 01-Dec-25 (periode November 2025, Bulan ke-74)
  ('Mandiri',              1048000,   timestamptz '2025-12-01 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-12-01 12:00:00'),
  ('Permata (Payroll)',    2724000,   timestamptz '2025-12-01 12:00:00'),
  ('Permata (ME)',         176000,    timestamptz '2025-12-01 12:00:00'),
  ('Permata (RDI Ajaib)',  4925000,   timestamptz '2025-12-01 12:00:00'),
  ('BCA (+BlubyBCA)',      1079000,   timestamptz '2025-12-01 12:00:00'),
  ('Jago (Main Pocket)',   104000,    timestamptz '2025-12-01 12:00:00'),
  ('Jago (Others Pocket)', 1002000,   timestamptz '2025-12-01 12:00:00'),
  ('Jago (Dana Darurat)',  39045000,  timestamptz '2025-12-01 12:00:00'),
  ('Bibit (+Stockbit)',    164558500, timestamptz '2025-12-01 12:00:00'),
  ('Ajaib',                3723000,   timestamptz '2025-12-01 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-12-01 12:00:00'),

  -- 25-Dec-25 (periode Desember 2025, Bulan ke-75, cek 1/3 — nilai kolom terakhir dari 2 entri tgl sama)
  ('Mandiri',              3557000,   timestamptz '2025-12-25 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2025-12-25 12:00:00'),
  ('Permata (Payroll)',    6871000,   timestamptz '2025-12-25 12:00:00'),
  ('Permata (ME)',         6216000,   timestamptz '2025-12-25 12:00:00'),
  ('Permata (RDI Ajaib)',  4340000,   timestamptz '2025-12-25 12:00:00'),
  ('BCA (+BlubyBCA)',      1319000,   timestamptz '2025-12-25 12:00:00'),
  ('Jago (Main Pocket)',   34000,     timestamptz '2025-12-25 12:00:00'),
  ('Jago (Others Pocket)', 1002000,   timestamptz '2025-12-25 12:00:00'),
  ('Jago (Dana Darurat)',  69045000,  timestamptz '2025-12-25 12:00:00'),
  ('Bibit (+Stockbit)',    165583500, timestamptz '2025-12-25 12:00:00'),
  ('Ajaib',                3723000,   timestamptz '2025-12-25 12:00:00'),
  ('Piutang',              150000,    timestamptz '2025-12-25 12:00:00'),

  -- 01-Jan-26 (periode Desember 2025, cek 2/3)
  ('Mandiri',              1772000,   timestamptz '2026-01-01 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-01-01 12:00:00'),
  ('Permata (Payroll)',    3370000,   timestamptz '2026-01-01 12:00:00'),
  ('Permata (ME)',         542000,    timestamptz '2026-01-01 12:00:00'),
  ('Permata (RDI Ajaib)',  4341000,   timestamptz '2026-01-01 12:00:00'),
  ('BCA (+BlubyBCA)',      1146000,   timestamptz '2026-01-01 12:00:00'),
  ('Jago (Main Pocket)',   293000,    timestamptz '2026-01-01 12:00:00'),
  ('Jago (Dana Darurat)',  69149000,  timestamptz '2026-01-01 12:00:00'),
  ('Bibit (+Stockbit)',    162438000, timestamptz '2026-01-01 12:00:00'),
  ('Ajaib',                4487000,   timestamptz '2026-01-01 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-01-01 12:00:00'),

  -- 04-Jan-26 (periode Desember 2025, cek 3/3 / Last Check)
  ('Mandiri',              1460000,   timestamptz '2026-01-04 12:00:00'),
  ('Mandiri (RDI MOST)',   30000,     timestamptz '2026-01-04 12:00:00'),
  ('Permata (Payroll)',    570000,    timestamptz '2026-01-04 12:00:00'),
  ('Permata (ME)',         430000,    timestamptz '2026-01-04 12:00:00'),
  ('Permata (RDI Ajaib)',  4341000,   timestamptz '2026-01-04 12:00:00'),
  ('BCA (+BlubyBCA)',      1131000,   timestamptz '2026-01-04 12:00:00'),
  ('Jago (Main Pocket)',   293000,    timestamptz '2026-01-04 12:00:00'),
  ('Jago (Others Pocket)', 7817000,   timestamptz '2026-01-04 12:00:00'),
  ('Jago (Dana Darurat)',  60149000,  timestamptz '2026-01-04 12:00:00'),
  ('Bibit (+Stockbit)',    162129500, timestamptz '2026-01-04 12:00:00'),
  ('Ajaib',                4638000,   timestamptz '2026-01-04 12:00:00'),
  ('Piutang',              150000,    timestamptz '2026-01-04 12:00:00')
) as v(name, amount, ts)
where acc.name = v.name;

-- Target Net Worth per periode (month: 0=Jan ... 11=Dec).
with fam as (select id from families limit 1)
insert into asset_targets (family_id, year, month, amount)
select fam.id, v.year, v.month, v.amount
from fam, (values
  (2024, 11, 189000000), -- Desember 2024
  (2025, 0,  192000000), -- Januari 2025
  (2025, 1,  195000000), -- Februari 2025
  (2025, 2,  198000000), -- Maret 2025
  (2025, 3,  201000000), -- April 2025
  (2025, 4,  204000000), -- Mei 2025
  (2025, 5,  207000000), -- Juni 2025
  (2025, 6,  210000000), -- Juli 2025
  (2025, 7,  213000000), -- Agustus 2025
  (2025, 8,  216000000), -- September 2025
  (2025, 9,  219000000), -- Oktober 2025
  (2025, 10, 222000000), -- November 2025
  (2025, 11, 225000000)  -- Desember 2025
) as v(year, month, amount)
on conflict (family_id, year, month) do update set amount = excluded.amount;
