-- Perbaikan: link akun login istri (ayudyasimadani@gmail.com) yang
-- kemungkinan terlepas karena baris family_members aslinya terhapus.
-- Aman dijalankan berkali-kali (kedua UPDATE ini no-op kalau tidak match).

-- Kasus 1: baris dengan email ini masih ada tapi belum ter-link
update family_members
set auth_user_id = (select id from auth.users where email = 'ayudyasimadani@gmail.com')
where email = 'ayudyasimadani@gmail.com' and auth_user_id is null;

-- Kasus 2: baris "Ayudya" ditambahkan manual lewat aplikasi (tanpa email) - link baris itu
update family_members
set email = 'ayudyasimadani@gmail.com',
    auth_user_id = (select id from auth.users where email = 'ayudyasimadani@gmail.com')
where auth_user_id is null and email is null and lower(name) like 'ayudya%';

-- Verifikasi - baris untuk istri harus punya auth_user_id terisi (bukan null):
select id, name, role, email, auth_user_id from family_members order by created_at;
