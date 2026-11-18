const express = require("express");
const path = require("node:path");

function createApp(pool) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(express.static(path.join(__dirname, "public")));

  // Semua nilai masukan dikirim sebagai parameter SQL (?) melalui execute().
  async function getById(id) {
    const [rows] = await pool.execute("select * from mahasiswa where id = ?", [
      id,
    ]);

    return rows[0];
  }

  function notFound(res) {
    return res.status(404).json({ message: "Mahasiswa tidak ditemukan." });
  }

  function validate(req, res, next) {
    const body = req.body;

    if (!body || Array.isArray(body) || typeof body !== "object") {
      return res.status(400).json({
        message: "Kirim data mahasiswa dalam format JSON.",
      });
    }

    const data = {};

    for (const field of ["nim", "nama", "prodi", "email"]) {
      if (typeof body[field] !== "string") {
        return res.status(400).json({
          message: `Kolom ${field} wajib diisi dengan teks.`,
        });
      }

      data[field] = body[field].trim();
    }

    if (!/^\d{8,20}$/.test(data.nim)) {
      return res.status(400).json({
        message: "NIM harus terdiri dari 8–20 angka.",
      });
    }

    if (
      [data.nama, data.prodi].some(
        (value) => value.length < 2 || value.length > 100,
      )
    ) {
      return res.status(400).json({
        message: "Nama dan program studi harus terdiri dari 2–100 karakter.",
      });
    }

    if (
      data.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    ) {
      return res.status(400).json({ message: "Alamat email tidak valid." });
    }

    req.mahasiswa = data;
    next();
  }

  app.param("id", (req, res, next, value) => {
    const id = Number(value);

    if (
      !/^[1-9]\d*$/.test(value) ||
      !Number.isSafeInteger(id) ||
      id > 4294967295
    ) {
      return res.status(400).json({ message: "ID mahasiswa tidak valid." });
    }

    req.mahasiswaId = id;
    next();
  });

  // READ: mengambil semua mahasiswa.
  app.get("/api/mahasiswa", async (req, res) => {
    const [rows] = await pool.execute(
      "select * from mahasiswa order by id desc",
    );

    res.json(rows);
  });

  // READ: mengambil satu mahasiswa berdasarkan ID.
  app.get("/api/mahasiswa/:id", async (req, res) => {
    const record = await getById(req.mahasiswaId);

    if (!record) {
      return notFound(res);
    }

    res.json(record);
  });

  // CREATE: menambahkan data mahasiswa.
  app.post("/api/mahasiswa", validate, async (req, res) => {
    const { nim, nama, prodi, email } = req.mahasiswa;
    const [result] = await pool.execute(
      "insert into mahasiswa (nim, nama, prodi, email) values (?, ?, ?, ?)",
      [nim, nama, prodi, email],
    );

    res
      .location(`/api/mahasiswa/${result.insertId}`)
      .status(201)
      .json({ id: result.insertId, nim, nama, prodi, email });
  });

  // UPDATE: mengganti seluruh kolom mahasiswa berdasarkan ID.
  app.put("/api/mahasiswa/:id", validate, async (req, res) => {
    const id = req.mahasiswaId;
    const { nim, nama, prodi, email } = req.mahasiswa;
    const [result] = await pool.execute(
      "update mahasiswa set nim = ?, nama = ?, prodi = ?, email = ? where id = ?",
      [nim, nama, prodi, email, id],
    );

    if (result.affectedRows === 0) {
      return notFound(res);
    }

    res.json({ id, nim, nama, prodi, email });
  });

  // DELETE: menghapus mahasiswa berdasarkan ID.
  app.delete("/api/mahasiswa/:id", async (req, res) => {
    const [result] = await pool.execute("delete from mahasiswa where id = ?", [
      req.mahasiswaId,
    ]);

    if (result.affectedRows === 0) {
      return notFound(res);
    }

    res.status(204).end();
  });

  app.use((req, res) => {
    res.status(404).json({ message: "Halaman atau endpoint tidak ditemukan." });
  });

  // Express 5 meneruskan kegagalan fungsi async ke penanganan galat ini.
  app.use((error, req, res, next) => {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "NIM sudah digunakan. Masukkan NIM yang berbeda.",
      });
    }

    if (error.type === "entity.parse.failed") {
      return res.status(400).json({ message: "Format JSON tidak valid." });
    }

    if (error.type === "entity.too.large") {
      return res
        .status(413)
        .json({ message: "Data yang dikirim terlalu besar." });
    }

    // Hindari mencetak SQL dan data pribadi dari objek error database.
    console.error("Kesalahan server:", error.code || error.name);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  });

  return app;
}

module.exports = { createApp };
