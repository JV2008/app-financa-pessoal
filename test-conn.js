import { sql } from "@neondatabase/serverless";

console.time("conexao");
const rows = await sql`SELECT 1`;
console.timeEnd("conexao");
console.log("Conectou com sucesso:", rows);
process.exit(0);
