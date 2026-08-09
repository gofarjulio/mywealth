-- MyWealth — PIN to gate editing/deleting Asset History entries
-- Jalankan sekali di Supabase SQL Editor.

alter table families add column if not exists edit_pin text;
-- null/empty = fitur PIN nonaktif (edit/hapus History bebas seperti sebelumnya)
