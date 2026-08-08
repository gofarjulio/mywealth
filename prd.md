# Product Requirements Document (PRD)
## Project Name: MyWealth
**Type:** Web-based Family Finance Portal

---

## 1. Project Overview
**MyWealth** adalah aplikasi portal web keuangan keluarga yang dirancang untuk mencatat, melacak, dan menganalisis arus kas (pemasukan dan pengeluaran) serta aset keluarga. 
Aplikasi ini menggabungkan **konsep desain UI/UX dari Factory Analytics Hub** (berbasis dashboard admin yang analitis dan rapi) dengan **fungsionalitas inti dari aplikasi Android Money Manager** (pencatatan double-entry yang disederhanakan, manajemen akun/dompet, dan statistik visual).

## 2. Design System & UI Layout (Referensi: Factory Analytics Hub)
Konsep desain web harus mengikuti struktur dashboard industrial/analytics yang sudah ada:
* **Layout Utama:** 
  * **Sidebar (Kiri):** Menu navigasi utama (Dashboard, Transaksi, Akun, Statistik, Pengaturan).
  * **Top Navbar (Atas):** Informasi profil pengguna/keluarga, tombol "+ Tambah Transaksi" cepat, dan filter periode waktu (Bulan Ini, Minggu Ini, dll).
  * **Main Content Area:** Menggunakan sistem *Card* (kartu) untuk memisahkan setiap widget informasi agar terlihat rapi dan mudah dibaca.
* **Tema Warna:** Profesional dan bersih (bisa mengadopsi skema warna dari Factory Analytics Hub), dengan penanda warna standar untuk keuangan (Hijau untuk Pemasukan/Aset, Merah untuk Pengeluaran/Liabilitas).
* **Responsivitas:** Harus Mobile-friendly karena pencatatan keuangan sering dilakukan melalui *smartphone*.

## 3. Core Features (Referensi: Money Manager App)

### 3.1. Dashboard (Halaman Utama)
Menyajikan ringkasan cepat kondisi keuangan keluarga.
* **Summary Cards:** Total Pemasukan, Total Pengeluaran, dan Saldo Bulan Ini.
* **Recent Transactions:** Tabel ringkas yang menampilkan 5-10 transaksi terakhir.
* **Quick Chart:** *Pie chart* (grafik donat) atau *Bar chart* sederhana yang menunjukkan porsi pengeluaran terbesar di bulan berjalan.

### 3.2. Manajemen Transaksi
Fitur untuk mencatat arus kas. Form input transaksi harus memuat field berikut:
* **Tipe:** Pemasukan (Income), Pengeluaran (Expense), atau Transfer.
* **Tanggal & Waktu:** Default ke hari ini.
* **Akun:** Sumber dana atau tujuan dana (Misal: Tunai, Livin' by Mandiri, GoPay).
* **Kategori:** 
  * Pengeluaran: Makanan, Transportasi (Misal: KAI, Bensin), Tagihan (Internet, Listrik), Belanja, dsb.
  * Pemasukan: Gaji, Bonus, Hasil Investasi.
* **Jumlah (Amount):** Input angka dengan format Rupiah (Rp).
* **Catatan (Note):** Deskripsi teks opsional.

### 3.3. Manajemen Akun (Accounts/Assets)
Mampu melacak saldo dari berbagai sumber dana dan aset keluarga. Dibagi menjadi beberapa grup:
* **Kas & Bank:** Uang Tunai, Rekening Bank (Contoh: Livin' by Mandiri, Permata ME).
* **Dompet Digital (E-Wallet):** GoPay, ShopeePay, dll.
* **Aset & Investasi:** Logam Mulia/Emas, Reksadana.
* **Kartu Kredit/Hutang:** Jika ada.
* *Fitur:* Pengguna dapat menyesuaikan (adjust) saldo akhir jika ada selisih.

### 3.4. Statistik & Analitik (Reports)
Visualisasi data keuangan yang interaktif.
* **Grafik Pengeluaran per Kategori:** Pie chart untuk melihat kategori mana yang paling memakan biaya.
* **Trend Arus Kas:** Line chart (grafik garis) yang membandingkan Pemasukan vs Pengeluaran dari bulan ke bulan.
* **Laporan Ringkasan:** Tabel rekapitulasi yang bisa diekspor.

### 3.5. Pengaturan (Settings)
* **Kategori Kustom:** Menambah/mengedit/menghapus kategori pemasukan dan pengeluaran.
* **Manajemen Anggota Keluarga:** (Opsional) Mode multi-user untuk suami dan istri agar bisa mencatat dari perangkat masing-masing (bisa disimulasikan di frontend terlebih dahulu).

## 4. Technical Requirements (Panduan untuk Claude)
* **Frontend:** HTML5, CSS3, JavaScript (ES6+).
* **Framework UI:** Bootstrap 5 atau Tailwind CSS (sesuai dengan basis Factory Analytics Hub).
* **Charts:** Chart.js atau ApexCharts untuk merender grafik statistik.
* **Icons:** FontAwesome atau Bootstrap Icons.
* **Penyimpanan Data (MVP):** Untuk versi awal (prototipe), gunakan `localStorage` browser agar web bisa langsung digunakan tanpa backend, ATAU siapkan struktur data JSON yang mudah diintegrasikan dengan Firebase/Supabase nantinya.

## 5. Struktur Data (JSON Mockup)
Sebagai referensi pembuatan logika JavaScript:
```json
{
  "accounts": [
    {"id": 1, "name": "Livin' by Mandiri", "type": "Bank", "balance": 5000000},
    {"id": 2, "name": "GoPay", "type": "E-Wallet", "balance": 250000},
    {"id": 3, "name": "Emas 10g", "type": "Asset", "balance": 15000000}
  ],
  "transactions": [
    {
      "id": "tx01",
      "date": "2026-08-08",
      "type": "expense",
      "amount": 50000,
      "category": "Makanan",
      "account_id": 2,
      "note": "Makan siang"
    }
  ]
}
```
