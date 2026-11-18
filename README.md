# CRUD Mahasiswa — Express.js + MySQL

Aplikasi Pengembangan Aplikasi Web untuk mengelola **satu tabel `mahasiswa`** pada database **`crud_mahasiswa`**. Backend menggunakan Express.js dan driver `mysql2`; frontend menggunakan HTML, CSS, dan JavaScript.

## 1. Persiapan

- Node.js versi 24 atau lebih baru. Node.js yang sudah kamu pasang dapat digunakan.
- MySQL Server 8.0.16 atau lebih baru (misalnya MySQL 8.4).
- MySQL Workbench untuk menjalankan SQL dan melihat tabel.
- VS Code untuk membuka kode dan menjalankan aplikasi.

MySQL Workbench adalah alat pengelola database. Pastikan **MySQL Server juga berjalan** dan koneksi Workbench berhasil. Jika MySQL terpasang sebagai Windows Service, buka `services.msc`, cari layanan MySQL milikmu, kemudian Start jika masih berhenti. Tidak perlu Laragon jika memakai MySQL Server yang terpasang mandiri.

Ekstrak versi ini ke folder baru `crud-mahasiswa-mysql`. Jika aplikasi lama masih berjalan, tekan **Ctrl+C** di terminalnya agar port 3000 tersedia.

## 2. Buat database melalui MySQL Workbench

1. Buka MySQL Workbench dan masuk ke koneksi MySQL yang biasa kamu gunakan.
2. Pilih **File → Open SQL Script**, lalu buka file `schema.sql` dari folder ini.
3. Jalankan **seluruh isi file**, termasuk `create database` dan `use`, dengan tombol petir untuk menjalankan semua pernyataan atau **Ctrl+Shift+Enter**.
4. Refresh bagian **SCHEMAS**. Database `crud_mahasiswa` akan muncul; di dalamnya terdapat tabel `mahasiswa`.

File SQL memakai `if not exists` sehingga tidak menghapus database/tabel yang telah ada. Aplikasi tidak mengisi akun atau data demo secara otomatis.

## 3. Atur koneksi MySQL

Buka folder `crud-mahasiswa-mysql` di VS Code. Pada terminal PowerShell jalankan:

```powershell
Copy-Item .env.example .env
```

Buka file `.env`, lalu sesuaikan dengan koneksi Workbench:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD="password_mysql_kamu"
DB_NAME=PAWTugas4
PORT=3000
```

- `DB_USER` adalah username MySQL, bukan nama pengguna Windows.
- Ganti `password_mysql_kamu` dengan password MySQL sebenarnya. Jika akun MySQL tidak memiliki password, gunakan `DB_PASSWORD=""`.
- Host dan port harus sama dengan koneksi yang kamu pakai di Workbench.
- `DB_PORT` adalah port MySQL; `PORT` adalah port website.
- `.env` hanya dibaca backend, tidak dikirim ke browser, dan dikecualikan oleh `.gitignore`.
- Setelah mengubah `.env`, hentikan dan jalankan ulang server.

## 4. Instal dependensi dan jalankan

Jalankan satu per satu dari terminal di folder yang berisi `package.json`:

```powershell
npm.cmd install
npm.cmd start
```

Jika berhasil:

```text
Koneksi MySQL berhasil.
Aplikasi berjalan di http://localhost:3000
```

Buka **http://localhost:3000**. Terminal harus tetap berjalan. Gunakan **Ctrl+C** untuk menghentikan server atau `npm.cmd run dev` untuk menjalankan mode pengembangan.

## 5. Coba fitur CRUD

1. **Create:** isi NIM, nama, program studi, dan email, lalu klik **Tambah mahasiswa**.
2. **Read:** data tampil pada tabel; gunakan pencarian untuk memfilter data yang sudah dimuat.
3. **Update:** klik **Edit**, ubah nilai, lalu klik **Simpan perubahan**. **Batal edit** keluar dari mode edit tanpa menyimpan.
4. **Delete:** klik **Hapus**, lalu konfirmasi **Hapus data**.
5. **Muat ulang:** mengambil ulang data terbaru dari MySQL, misalnya setelah kamu mengubahnya di Workbench.

Contoh data: NIM `255150301111001`, nama `Mahasiswa Demo`, program studi `Teknologi Informasi`, email `demo@example.com`.

NIM harus unik dan terdiri dari 8–20 angka. NIM menggunakan `varchar` agar nol di depan tidak hilang. Data yang ditambahkan tetap tersimpan di MySQL setelah server Express dihentikan.

## 6. Melihat data di Workbench

Jalankan:

```sql
use crud_mahasiswa;

select *
from mahasiswa;
```

Jalankan ulang kueri setelah menambah, mengedit, atau menghapus data melalui website. Bisa juga klik kanan tabel `mahasiswa` pada SCHEMAS, lalu pilih **Select Rows - Limit 1000**.

## 7. Struktur database

| Kolom | Tipe         | Aturan                                                    |
| ----- | ------------ | --------------------------------------------------------- |
| id    | int unsigned | Primary key, auto_increment                               |
| nim   | varchar(20)  | Wajib, unik, 8–20 angka (format angka divalidasi backend) |
| nama  | varchar(100) | Wajib, 2–100 karakter                                     |
| prodi | varchar(100) | Wajib, 2–100 karakter                                     |
| email | varchar(254) | Wajib, format email divalidasi backend                    |

## 8. Susunan file

| File                | Fungsi                                                       |
| ------------------- | ------------------------------------------------------------ |
| `server.js`         | Memeriksa koneksi MySQL dan menjalankan Express              |
| `database.js`       | Membaca `.env` dan membuat connection pool MySQL             |
| `app.js`            | Route CRUD, validasi, SQL berparameter, dan penanganan galat |
| `schema.sql`        | Membuat database dan tabel MySQL                             |
| `.env.example`      | Contoh konfigurasi untuk disalin menjadi `.env`              |
| `public/index.html` | Formulir, tabel, dan dialog hapus                            |
| `public/style.css`  | CSS yang ditulis dengan baris dan indentasi rapi             |
| `public/app.js`     | Mengirim request API dan memperbarui tampilan                |
| `test/`             | Pengujian kontrak API dan integrasi MySQL                    |

## 9. Endpoint API

| Operasi    | Method | Endpoint             | Respons berhasil      |
| ---------- | ------ | -------------------- | --------------------- |
| Baca semua | GET    | `/api/mahasiswa`     | 200, array            |
| Baca satu  | GET    | `/api/mahasiswa/:id` | 200, objek            |
| Tambah     | POST   | `/api/mahasiswa`     | 201, objek baru       |
| Edit       | PUT    | `/api/mahasiswa/:id` | 200, objek hasil edit |
| Hapus      | DELETE | `/api/mahasiswa/:id` | 204, tanpa body       |

POST dan PUT menggunakan `Content-Type: application/json` dan seluruh kolom berikut:

```json
{
  "nim": "255150301111001",
  "nama": "Mahasiswa Demo",
  "prodi": "Teknologi Informasi",
  "email": "demo@example.com"
}
```

Respons galat: 400 masukan tidak valid, 404 data tidak ditemukan, 409 NIM duplikat, 413 request terlalu besar, 500 galat server. `execute(sql, values)` memisahkan SQL dari nilai pengguna. `async/await` menunggu hasil MySQL sebelum server mengirim respons.

## 10. Mengatasi masalah

| Pesan/gejala                             | Langkah                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| MySQL belum berjalan / ECONNREFUSED      | Jalankan layanan MySQL; periksa DB_HOST dan DB_PORT                           |
| Access denied                            | Periksa username/password pada `.env`; samakan dengan koneksi Workbench       |
| Unknown database                         | Jalankan seluruh `schema.sql`; pastikan DB_NAME benar                         |
| Tabel mahasiswa belum tersedia           | Jalankan `schema.sql` pada server yang sama dengan konfigurasi `.env`         |
| Port website sedang digunakan            | Hentikan aplikasi lama atau ganti PORT menjadi 3001, lalu buka localhost:3001 |
| NIM sudah digunakan                      | Masukkan NIM yang berbeda                                                     |
| Data Workbench belum terlihat di website | Klik **Muat ulang**                                                           |

## 11. Pengujian

```powershell
npm.cmd test
```

Perintah di atas menguji kontrak API dan validasi dengan **simulasi pool MySQL**. Ini tidak membuktikan koneksi ke server MySQL sungguhan.

Untuk menguji integrasi setelah MySQL dan `.env` siap:

```powershell
npm.cmd run test:mysql
```

Uji integrasi membutuhkan akun yang memiliki izin membuat dan menghapus database. Pengujian membuat database sementara bernama `crud_test_` dengan akhiran acak, menjalankan CRUD, memeriksa hasil melalui koneksi baru, lalu menghapus **database sementara tersebut saja**. Database `crud_mahasiswa` tidak dihapus atau dikosongkan. Jika koneksi gagal, perintah mengembalikan status gagal (bukan melewati pengujian).

## 12. Peralihan dari versi SQLite

Versi ini menyimpan data di MySQL dan tidak membaca `data/mahasiswa.db`. Data lama yang pernah dimasukkan ke SQLite **tidak dipindahkan otomatis**. Simpan folder versi lama jika datanya masih diperlukan. Database MySQL baru mulai kosong kecuali sebelumnya sudah kamu isi.

Aplikasi untuk praktikum lokal ini belum memakai login. Server hanya menerima koneksi di komputer lokal (`127.0.0.1`).

Referensi resmi: https://sidorares.github.io/node-mysql2/docs dan https://dev.mysql.com/doc/refman/8.4/en/create-table.html.
