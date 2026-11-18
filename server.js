const { once } = require("node:events");
const { createApp } = require("./app");
const { createPool } = require("./database");

async function start() {
  const pool = createPool();

  try {
    // Memastikan koneksi, database, dan tabel siap sebelum menerima request.
    await pool.execute(
      "select id, nim, nama, prodi, email from mahasiswa limit 0",
    );

    const app = createApp(pool);
    const port = Number(process.env.PORT || 3000);
    const server = app.listen(port, "127.0.0.1");

    await once(server, "listening");
    console.log("Koneksi MySQL berhasil.");
    console.log(`Aplikasi berjalan di http://localhost:${port}`);

    let stopping = false;

    function shutdown() {
      if (stopping) {
        return;
      }

      stopping = true;
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    const messages = {
      ECONNREFUSED:
        "MySQL belum berjalan atau DB_HOST/DB_PORT pada .env salah.",
      ER_ACCESS_DENIED_ERROR:
        "Username/password MySQL salah. Periksa DB_USER dan DB_PASSWORD pada .env.",
      ER_BAD_DB_ERROR:
        "Database belum tersedia. Jalankan schema.sql melalui MySQL Workbench.",
      ER_NO_SUCH_TABLE:
        "Tabel mahasiswa belum tersedia. Jalankan schema.sql melalui MySQL Workbench.",
      EADDRINUSE:
        "Port website sedang digunakan. Hentikan server lama atau ubah PORT pada .env.",
    };

    console.error("Gagal menjalankan aplikasi.");
    console.error(
      messages[error.code] ||
        `Periksa konfigurasi koneksi. Kode: ${error.code || error.name}`,
    );
    await pool.end();
    process.exitCode = 1;
  }
}

start();
