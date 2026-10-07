

const { Client } = require('pg');

const CURRENT_TYPE_CONSTRAINT = 'transactions_type_check'; // SUPOSIÇÃO — confirmar nome real

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // padrão para Neon; ajustar se o projeto usa outra config
  });

  await client.connect();

  try {
    await client.query('BEGIN');

    // 1. Permitir os dois novos valores de type para as pernas da transferência.
    await client.query(`
      ALTER TABLE transactions
        DROP CONSTRAINT IF EXISTS ${CURRENT_TYPE_CONSTRAINT};
    `);

    await client.query(`
      ALTER TABLE transactions
        ADD CONSTRAINT transactions_type_check
        CHECK (type IN ('income', 'expense', 'transfer_in', 'transfer_out'));
    `);

    // 2. Campo que liga as duas pernas de uma mesma transferência.
    await client.query(`
      ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS transfer_group_id UUID NULL;
    `);

    // 3. category_id precisa aceitar NULL (transferência não tem categoria).
    await client.query(`
      ALTER TABLE transactions
        ALTER COLUMN category_id DROP NOT NULL;
    `);

    // 4. Índice para buscar a "outra perna" de uma transferência rapidamente.
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_transfer_group
        ON transactions (transfer_group_id)
        WHERE transfer_group_id IS NOT NULL;
    `);

    // 5. Integridade: perna de transferência nunca pode ter categoria.
    await client.query(`
      ALTER TABLE transactions
        ADD CONSTRAINT chk_transfer_has_no_category
        CHECK (
          (type IN ('transfer_in', 'transfer_out') AND category_id IS NULL)
          OR (type IN ('income', 'expense'))
        );
    `);

    // 6. Integridade: toda perna de transferência tem transfer_group_id,
    //    e transação normal (income/expense) nunca tem.
    await client.query(`
      ALTER TABLE transactions
        ADD CONSTRAINT chk_transfer_group_consistency
        CHECK (
          (type IN ('transfer_in', 'transfer_out') AND transfer_group_id IS NOT NULL)
          OR (type IN ('income', 'expense') AND transfer_group_id IS NULL)
        );
    `);

    await client.query('COMMIT');
    console.log('[002addTransfers] Migration aplicada com sucesso.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[002addTransfers] Falhou, rollback executado. Nenhuma alteração persistida.');
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

// ============================================================
// Rollback manual (não automatizado aqui de propósito — reverter
// schema é decisão que não deve rodar sem confirmação humana,
// especialmente se já existirem transferências reais criadas).
// Para reverter, execute manualmente via scripts/migrate.js ou psql:
//
//   BEGIN;
//   ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transfer_group_consistency;
//   ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transfer_has_no_category;
//   DROP INDEX IF EXISTS idx_transactions_transfer_group;
//   ALTER TABLE transactions DROP COLUMN IF EXISTS transfer_group_id;
//   ALTER TABLE transactions ALTER COLUMN category_id SET NOT NULL; -- só se não houver NULLs
//   ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
//   ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
//     CHECK (type IN ('income', 'expense'));
//   COMMIT;
// ============================================================

migrate();