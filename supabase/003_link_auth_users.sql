-- MyWealth — hubungkan akun login ke data keluarga
-- Jalankan SETELAH kedua akun berikut dibuat di:
-- Supabase Dashboard → Authentication → Users → Add user
--   1. gofarjulio@gmail.com
--   2. ayudyasimadani@gmail.com
-- ("Auto Confirm User" boleh dicentang supaya tidak perlu klik link
-- verifikasi email.)

update family_members fm
set auth_user_id = u.id
from auth.users u
where fm.email = u.email
  and fm.auth_user_id is null;

-- Cek hasilnya — kedua baris di bawah harus terisi auth_user_id (bukan null):
select name, role, email, auth_user_id from family_members;
