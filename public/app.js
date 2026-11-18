const form = document.querySelector("#student-form");
const rows = document.querySelector("#rows");
const notice = document.querySelector("#notice");
const formError = document.querySelector("#form-error");
const dialog = document.querySelector("#delete-dialog");
const save = document.querySelector("#save");
let students = [];
let editingId = null;
let deletingId = null;
let busy = false;

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Permintaan gagal.");
  return data;
}

function announce(message, failure = false) {
  notice.textContent = message;
  notice.classList.toggle("failure", failure);
  notice.hidden = false;
}

// textContent membuat masukan pengguna tampil sebagai teks biasa, bukan HTML.
function element(tag, text, className) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

function render() {
  const query = document.querySelector("#search").value.trim().toLowerCase();
  const filtered = students.filter((student) =>
    [student.nim, student.nama, student.prodi, student.email].some((value) =>
      value.toLowerCase().includes(query),
    ),
  );
  rows.replaceChildren();
  for (const student of filtered) {
    const row = document.createElement("tr");
    const identity = document.createElement("td");
    identity.append(
      element("span", student.nama, "student-name"),
      element("span", student.nim, "student-sub"),
      element("span", student.email, "student-sub"),
    );
    const actionsCell = document.createElement("td");
    const actions = element("div", "", "actions");
    const edit = element("button", "Edit", "edit-button");
    edit.setAttribute("aria-label", `Edit ${student.nama}`);
    edit.disabled = busy;
    edit.onclick = () => startEdit(student);
    const remove = element("button", "Hapus", "delete-button");
    remove.setAttribute("aria-label", `Hapus ${student.nama}`);
    remove.disabled = busy;
    remove.onclick = () => {
      deletingId = student.id;
      document.querySelector("#delete-text").textContent =
        `${student.nama} (${student.nim}) akan dihapus dari daftar.`;
      document.querySelector("#delete-error").hidden = true;
      dialog.showModal();
      document.querySelector("#delete-cancel").focus();
    };
    actions.append(edit, remove);
    actionsCell.append(actions);
    row.append(identity, element("td", student.prodi), actionsCell);
    rows.append(row);
  }
  document.querySelector("#total").textContent = `${students.length} mahasiswa`;
  const empty = document.querySelector("#empty");
  empty.hidden = filtered.length > 0;
  empty.textContent = students.length
    ? "Tidak ada mahasiswa yang sesuai dengan pencarian."
    : "Belum ada mahasiswa. Tambahkan data pertama melalui formulir.";
  document.querySelector("#result-count").textContent =
    `Menampilkan ${filtered.length} dari ${students.length} mahasiswa`;
}

async function load() {
  students = await api("/api/mahasiswa");
  render();
}

function resetForm() {
  editingId = null;
  form.reset();
  formError.hidden = true;
  document.querySelector("#form-title").textContent = "Tambah mahasiswa";
  save.textContent = "Tambah mahasiswa";
  document.querySelector("#cancel").hidden = true;
}

function startEdit(student) {
  editingId = student.id;
  for (const field of ["nim", "nama", "prodi", "email"])
    form.elements[field].value = student[field];
  document.querySelector("#form-title").textContent = "Edit mahasiswa";
  save.textContent = "Simpan perubahan";
  document.querySelector("#cancel").hidden = false;
  formError.hidden = true;
  form.elements.nim.focus();
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function setBusy(value) {
  busy = value;
  for (const control of form.elements) control.disabled = value;
  document.querySelector("#refresh").disabled = value;
  document.querySelector("#delete-confirm").disabled = value;
  document.querySelector("#delete-cancel").disabled = value;
  render();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const body = Object.fromEntries(new FormData(form));
  const wasEditing = editingId !== null;
  formError.hidden = true;
  setBusy(true);
  save.textContent = "Menyimpan…";
  try {
    const record = await api(
      wasEditing ? `/api/mahasiswa/${editingId}` : "/api/mahasiswa",
      {
        method: wasEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (wasEditing)
      students = students.map((student) =>
        student.id === record.id ? record : student,
      );
    else students.unshift(record);
    resetForm();
    announce(
      wasEditing
        ? "Perubahan mahasiswa berhasil disimpan."
        : "Mahasiswa berhasil ditambahkan.",
    );
  } catch (error) {
    formError.textContent = error.message;
    formError.hidden = false;
  } finally {
    save.textContent =
      editingId === null ? "Tambah mahasiswa" : "Simpan perubahan";
    setBusy(false);
  }
});

document.querySelector("#cancel").onclick = resetForm;
document.querySelector("#search").addEventListener("input", render);
document.querySelector("#refresh").onclick = async () => {
  setBusy(true);
  try {
    await load();
    announce("Daftar mahasiswa sudah diperbarui.");
  } catch (error) {
    announce(`Gagal memuat data: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
};

dialog.addEventListener("cancel", (event) => {
  if (busy) event.preventDefault();
});

document.querySelector("#delete-cancel").onclick = () => dialog.close();
document.querySelector("#delete-confirm").onclick = async () => {
  if (busy) return;
  setBusy(true);
  try {
    await api(`/api/mahasiswa/${deletingId}`, { method: "DELETE" });
    students = students.filter((student) => student.id !== deletingId);
    if (editingId === deletingId) resetForm();
    dialog.close();
    announce("Mahasiswa berhasil dihapus.");
  } catch (error) {
    const message = document.querySelector("#delete-error");
    message.textContent = error.message;
    message.hidden = false;
  } finally {
    setBusy(false);
  }
};

load().catch((error) => {
  document.querySelector("#total").textContent = "Tidak tersedia";
  document.querySelector("#empty").textContent =
    "Data gagal dimuat. Klik Muat ulang untuk mencoba lagi.";
  announce(`Gagal terhubung ke server: ${error.message}`, true);
});
