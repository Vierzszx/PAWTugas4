const mysql = require("mysql2/promise");
const path = require("node:path");
const fs = require("node:fs");

// Lokasi .env mengikuti folder proyek, bukan lokasi terminal.
const envPath = path.join(__dirname, ".env");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

function databaseConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "crud_mahasiswa",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 10000,
    // UPDATE yang nilainya sama tetap dihitung sebagai baris yang ditemukan.
    flags: ["FOUND_ROWS"],
  };
}

function createPool(config = databaseConfig()) {
  return mysql.createPool(config);
}

module.exports = { createPool, databaseConfig };
