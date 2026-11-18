const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const { createPool, databaseConfig } = require("../database");
const { exerciseApi } = require("./exercise-api");

test("Integrasi CRUD dengan server MySQL sungguhan dan koneksi baru", async () => {
  const config = databaseConfig();
  delete config.database;
  const admin = await mysql.createConnection(config);
  // Nama ini dibuat secara acak oleh pengujian, tidak menggunakan database pengguna.
  const temporaryName = `crud_test_${randomBytes(8).toString("hex")}`;
  let pool;
  let created = false;

  try {
    await admin.query(
      `create database \`${temporaryName}\` character set utf8mb4 collate utf8mb4_unicode_ci`,
    );
    created = true;
    await admin.changeUser({ database: temporaryName });
    const schema = readFileSync(
      path.join(__dirname, "..", "schema.sql"),
      "utf8",
    );
    const tableSql = schema.slice(
      schema.indexOf("create table if not exists mahasiswa"),
    );
    await admin.query(tableSql);
    pool = createPool({ ...config, database: temporaryName });

    await exerciseApi(pool, async (id, nama) => {
      // Baca melalui koneksi baru yang terpisah dari pool API.
      const connection = await mysql.createConnection({
        ...config,
        database: temporaryName,
      });
      try {
        const [rows] = await connection.execute(
          "select nama from mahasiswa where id = ?",
          [id],
        );
        assert.equal(rows[0].nama, nama);
      } finally {
        await connection.end();
      }
    });
  } finally {
    if (pool) {
      await pool.end();
    }
    if (created) {
      await admin.query(`drop database \`${temporaryName}\``);
    }
    await admin.end();
  }
});
