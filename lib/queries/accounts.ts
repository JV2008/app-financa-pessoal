import { pool } from "@/lib/db";

export type AccountRow = {
  id: string;
  user_id: string;
  name: string;
  type: "corrente" | "poupanca" | "investimento";
  currency: string;
  created_at: string;
};

export async function getAccountsByUser(userId: string): Promise<AccountRow[]> {
  const { rows } = await pool.query(
    "SELECT id, user_id, name, type, currency, created_at FROM account WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

export async function createAccount(
  userId: string,
  data: { name: string; type: AccountRow["type"]; currency?: string }
) {
  const { rows } = await pool.query(
    "INSERT INTO account (user_id, name, type, currency) VALUES ($1, $2, $3, $4) RETURNING id, user_id, name, type, currency, created_at",
    [userId, data.name, data.type, data.currency ?? "BRL"]
  );
  return rows[0];
}

export async function getAccountById(accountId: string) {
  const { rows } = await pool.query(
    "SELECT id, user_id, name, type, currency, created_at FROM account WHERE id = $1",
    [accountId]
  );
  return rows[0] ?? null;
}

export async function getBalanceSummary(userId: string, accountId?: string) {
  const params: (string | undefined)[] = [userId];
  let accountFilter = "";
  if (accountId) {
    accountFilter = "AND t.account_id = $2";
    params.push(accountId);
  }

  const { rows } = await pool.query(
    `SELECT
       SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE -t.amount END) as balance,
       SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE 0 END) as income,
       SUM(CASE WHEN t.type = 'despesa' THEN t.amount ELSE 0 END) as expenses
     FROM transaction t
     JOIN account a ON a.id = t.account_id
     WHERE a.user_id = $1 ${accountFilter}`,
    params
  );
  const row = rows[0];
  return {
    balance: Number(row?.balance ?? 0),
    income: Number(row?.income ?? 0),
    expenses: Number(row?.expenses ?? 0),
  };
}