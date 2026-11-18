const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { createApp } = require("../app");
const { exerciseApi } = require("./exercise-api");

// Simulasi pool khusus pengujian; aplikasi sebenarnya memakai mysql2.
function fakePool() {
  const rows = new Map();
  let nextId = 1;

  return {
    async execute(sql, values = []) {
      if (sql === "select * from mahasiswa order by id desc") {
        return [[...rows.values()].sort((a, b) => b.id - a.id)];
      }

      if (sql === "select * from mahasiswa where id = ?") {
        const record = rows.get(values[0]);
        return [record ? [record] : []];
      }

      if (sql === "delete from mahasiswa where id = ?") {
        return [{ affectedRows: Number(rows.delete(values[0])) }];
      }

      const isInsert =
        sql ===
        "insert into mahasiswa (nim, nama, prodi, email) values (?, ?, ?, ?)";
      const isUpdate =
        sql ===
        "update mahasiswa set nim = ?, nama = ?, prodi = ?, email = ? where id = ?";
      assert.ok(
        isInsert || isUpdate,
        "Kueri harus menggunakan SQL berparameter yang dikenal.",
      );
      const [nim, nama, prodi, email, updateId] = values;

      if (isUpdate && !rows.has(updateId)) {
        return [{ affectedRows: 0 }];
      }

      if (
        [...rows.values()].some((row) => row.nim === nim && row.id !== updateId)
      ) {
        throw Object.assign(new Error("Duplicate"), { code: "ER_DUP_ENTRY" });
      }

      const id = isInsert ? nextId++ : updateId;
      rows.set(id, { id, nim, nama, prodi, email });
      return [{ insertId: id, affectedRows: 1 }];
    },
  };
}

test("Kontrak CRUD dan validasi API menggunakan simulasi pool MySQL", async () => {
  await exerciseApi(fakePool());
});

test("Kegagalan async database ditangani tanpa membocorkan data koneksi", async () => {
  const pool = {
    async execute() {
      throw Object.assign(new Error("secret-database-detail"), {
        code: "ECONNRESET",
      });
    },
  };
  
  const server = createApp(pool).listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/mahasiswa`,
    );
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      message: "Terjadi kesalahan pada server.",
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
