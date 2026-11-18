-- Jalankan seluruh isi file ini sekali melalui MySQL Workbench.
-- Membuat database khusus aplikasi; tidak menghapus database yang sudah ada.
create database if not exists PAWTugas4
  character set utf8mb4
  collate utf8mb4_unicode_ci;

use PAWTugas4;

create table if not exists mahasiswa (
  id int unsigned not null auto_increment,
  nim varchar(20) not null,
  nama varchar(100) not null,
  prodi varchar(100) not null,
  email varchar(254) not null,

  primary key (id),
  constraint uq_mahasiswa_nim unique (nim),
  constraint chk_mahasiswa_nim check (char_length(nim) between 8 and 20),
  constraint chk_mahasiswa_nama check (char_length(trim(nama)) between 2 and 100),
  constraint chk_mahasiswa_prodi check (char_length(trim(prodi)) between 2 and 100),
  constraint chk_mahasiswa_email check (char_length(email) between 3 and 254)
) engine = InnoDB;
