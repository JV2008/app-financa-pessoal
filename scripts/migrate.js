/**
 * Aplica db/schema.sql contra o banco apontado por DATABASE_URL.
 *
 * Uso:
 *   node -r dotenv/config scripts/migrate.js dotenv_config_path=.env.local
 * ou, com DATABASE_URL já exportada no shell:
 *   node scripts/migrate.js
 *
 * Todos os CREATE TABLE/INDEX rodam dentro de uma única transação
 * (via sql.transaction) -- se qualquer statement falhar, nada fica
 * aplicado pela metade.
 *
 * Idempotencia: as CREATE TABLE do schema.sql atual NAO usam
 * "IF NOT EXISTS". Rodar este script contra um banco que ja tem as
 * tabelas vai falhar com "relation already exists" -- intencional por
 * enquanto, para nao mascarar rodar duas vezes por engano.
 */

const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

async function main() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error("Erro: variavel de ambiente DATABASE_URL nao definida.");
        process.exit(1);
    }

    const schemaPath = path.join(__dirname, "..", "db", "schema.sql");

    if (!fs.existsSync(schemaPath)) {
        console.error(`Erro: arquivo de schema nao encontrado em ${schemaPath}`);
        process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    const schemaSqlNoComments = schemaSql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");

    const statements = schemaSqlNoComments
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    console.log("Banco:", databaseUrl.replace(/:[^:@]+@/, ":****@"));
    console.log("Arquivo:", schemaPath);
    console.log(`Statements a aplicar: ${statements.length}`);
    console.log("");

    const sql = neon(databaseUrl);

    try {
        for (const statement of statements) {
            console.log(">", statement.split("\n")[0].slice(0, 80));
        }
        console.log("");
        console.log("Aplicando em transacao unica...");

        await sql.transaction(statements.map((statement) => sql(statement)));

        console.log("");
        console.log("Schema aplicado com sucesso.");
    } catch (error) {
        console.error("");
        console.error("Falha ao aplicar schema:", error.message);
        console.error("");
        console.error(
            "Se o erro for 'relation already exists', o schema provavelmente ja foi aplicado antes -- nao rode este script de novo contra o mesmo banco sem revisar o estado atual primeiro."
        );
        process.exit(1);
    }
}

main();