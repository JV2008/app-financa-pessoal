const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});
console.time("conexao");
pool.query("SELECT 1")
  .then((r) => {
    console.timeEnd("conexao");
    console.log("Conectou com sucesso:", r.rows);
    process.exit(0);
  })
  .catch((e) => {
    console.timeEnd("conexao");
    console.error("Falhou:", e.message, e.cause?.message);
    process.exit(1);
  });