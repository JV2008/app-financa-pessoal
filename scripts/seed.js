/**
 * Aplica db/seed.sql (dados iniciais: categorias padrão) contra o banco
 * apontado por DATABASE_URL.
 *
 * Uso:
 *   node -r dotenv/config scripts/seed.js dotenv_config_path=.env.local
 *
 * NAO usa ON CONFLICT, entao rodar duas vezes cria categorias duplicadas.
 * Se precisar rodar de novo, apague as categorias antigas antes ou
 * adicione uma constraint de unicidade em (name, type) e ON CONFLICT
 * DO NOTHING no seed.sql.
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

    const seedPath = path.join(__dirname, "..", "db", "seed.sql");

    if (!fs.existsSync(seedPath)) {
        console.error(`Erro: arquivo de seed nao encontrado em ${seedPath}`);
        process.exit(1);
    }

    const seedSql = fs.readFileSync(seedPath, "utf-8");

    const seedSqlNoComments = seedSql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");

    const statements = seedSqlNoComments
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    console.log("Banco:", databaseUrl.replace(/:[^:@]+@/, ":****@"));
    console.log("Arquivo:", seedPath);
    console.log(`Statements a aplicar: ${statements.length}`);
    console.log("");

    const sql = neon(databaseUrl);

    try {
        for (const statement of statements) {
            console.log(">", statement.split("\n")[0].slice(0, 80));
        }
        console.log("");
        console.log("Aplicando em transacao unica...");

        await sql.transaction(statements.map((statement) => sql.query(statement)));

        console.log("");
        console.log("Seed aplicado com sucesso.");
    } catch (error) {
        console.error("");
        console.error("Falha ao aplicar seed:", error.message);
        process.exit(1);
    }
}

main();