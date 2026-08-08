-- MyWealth — data awal
-- Jalankan SETELAH 001_schema.sql berhasil.
-- Nama masih placeholder ("Suami"/"Istri") — bisa diganti lewat
-- Pengaturan di aplikasi setelah login pertama kali.

with new_family as (
  insert into families (name) values ('Keluarga Saya')
  returning id
),
members as (
  insert into family_members (family_id, email, name, role, initials)
  select id, 'gofarjulio@gmail.com', 'Suami', 'Suami', 'SU' from new_family
  union all
  select id, 'ayudyasimadani@gmail.com', 'Istri', 'Istri', 'IS' from new_family
  returning family_id
)
insert into categories (family_id, type, name, icon, color_slot)
select family_id, 'expense', v.name, v.icon, v.slot
from members, (values
  ('Makanan',       'bi-cup-hot',            1),
  ('Transportasi',  'bi-train-front',        2),
  ('Tagihan',       'bi-lightning-charge',   3),
  ('Belanja',       'bi-bag',                4),
  ('Kesehatan',     'bi-heart-pulse',        5),
  ('Hiburan',       'bi-film',               6),
  ('Pendidikan',    'bi-mortarboard',        7),
  ('Lainnya',       'bi-three-dots',         8)
) as v(name, icon, slot)
union all
select family_id, 'income', v.name, v.icon, v.slot
from members, (values
  ('Gaji',            'bi-briefcase',         1),
  ('Bonus',           'bi-gift',              3),
  ('Hasil Investasi', 'bi-graph-up-arrow',    6),
  ('Lainnya',         'bi-three-dots',        8)
) as v(name, icon, slot);

-- Akun (dompet/bank/aset) dan transaksi SENGAJA tidak diisi contoh —
-- ini akan jadi data keuangan asli Anda, diisi lewat aplikasi setelah
-- login pertama kali (menu Akun → Tambah Akun).
-- Lanjut ke 003_link_auth_users.sql setelah kedua akun login dibuat.
