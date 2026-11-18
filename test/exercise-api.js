const assert = require("node:assert/strict");
const { once } = require("node:events");
const { createApp } = require("../app");

// Kontrak API yang sama digunakan oleh uji simulasi dan uji MySQL sungguhan.
async function exerciseApi(pool, verifyPersistence = async () => {}) {
  const server = createApp(pool).listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (route, method = "GET", body) =>
    fetch(base + route, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const mahasiswa = {
    nim: "255150301111001",
    nama: "Mahasiswa Demo",
    prodi: "Teknologi Informasi",
    email: "demo@example.com",
  };

  try {
    assert.equal((await request("/")).status, 200);
    assert.deepEqual(await (await request("/api/mahasiswa")).json(), []);

    const created = await request("/api/mahasiswa", "POST", mahasiswa);
    assert.equal(created.status, 201);
    const record = await created.json();
    const url = `/api/mahasiswa/${record.id}`;
    assert.equal(created.headers.get("location"), url);
    assert.equal((await (await request(url)).json()).nama, mahasiswa.nama);
    assert.equal(
      (await request("/api/mahasiswa", "POST", mahasiswa)).status,
      409,
    );

    for (const invalid of [
      { ...mahasiswa, nim: "abc" },
      { ...mahasiswa, nim: 12345678 },
      { ...mahasiswa, nama: "  " },
      { ...mahasiswa, prodi: "x".repeat(101) },
      { ...mahasiswa, email: "salah" },
      {},
      [],
    ]) {
      assert.equal(
        (await request("/api/mahasiswa", "POST", invalid)).status,
        400,
      );
    }

    const changedData = {
      ...mahasiswa,
      nama: "Nama O'Connor",
      prodi: "Teknologi Informasi 🎓",
    };
    const changed = await request(url, "PUT", changedData);
    assert.equal(changed.status, 200);
    assert.equal((await changed.json()).nama, changedData.nama);
    assert.equal((await (await request(url)).json()).prodi, changedData.prodi);

    // Menyimpan nilai yang sama harus berhasil, bukan dianggap data hilang.
    assert.equal((await request(url, "PUT", changedData)).status, 200);

    const second = await (
      await request("/api/mahasiswa", "POST", {
        ...mahasiswa,
        nim: "000012345678",
      })
    ).json();
    assert.equal(second.nim, "000012345678");
    assert.equal(
      (await request(`/api/mahasiswa/${second.id}`, "PUT", mahasiswa)).status,
      409,
    );
    const list = await (await request("/api/mahasiswa")).json();
    assert.equal(list.length, 2);
    assert.equal(list[0].id, second.id);
    await verifyPersistence(record.id, changedData.nama);

    assert.equal((await request("/api/mahasiswa/99999")).status, 404);
    assert.equal((await request("/api/mahasiswa/abc")).status, 400);
    assert.equal((await request("/api/mahasiswa/4294967296")).status, 400);
    assert.equal((await request("/api/mahasiswa/1abc", "DELETE")).status, 400);
    const malformed = await fetch(base + "/api/mahasiswa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(malformed.status, 400);
    assert.equal(
      (
        await request("/api/mahasiswa", "POST", {
          ...mahasiswa,
          nama: "x".repeat(20000),
        })
      ).status,
      413,
    );

    assert.equal((await request(url, "DELETE")).status, 204);
    assert.equal((await request(url)).status, 404);
    assert.equal((await request(url, "PUT", mahasiswa)).status, 404);
    assert.equal((await request(url, "DELETE")).status, 404);
    assert.equal((await (await request("/api/mahasiswa")).json()).length, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

module.exports = { exerciseApi };
