import { pool } from "@/lib/db";

export type TransactionRow = {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: string;
  type: "receita" | "despesa" | "transferencia";
  description: string | null;
  occurred_at: string;
  created_at: string;
};

export async function getTransactionsByUser(
  userId: string,
  filters?: { accountId?: string; categoryId?: string; startDate?: string; endDate?: string; month?: string }
) {
  let query = `
    SELECT t.id, t.account_id, t.category_id, t.amount, t.type, t.description, t.occurred_at, t.created_at
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    WHERE a.user_id = $1
  `;
  const params: (string | undefined)[] = [userId];
  let idx = 2;

  if (filters?.accountId) {
    query += ` AND t.account_id = $${idx}`;
    params.push(filters.accountId);
    idx++;
  }
  if (filters?.categoryId) {
    query += ` AND t.category_id = $${idx}`;
    params.push(filters.categoryId);
    idx++;
  }
  if (filters?.startDate) {
    query += ` AND t.occurred_at >= $${idx}`;
    params.push(filters.startDate);
    idx++;
  }
  if (filters?.endDate) {
    query += ` AND t.occurred_at <= $${idx}`;
    params.push(filters.endDate);
    idx++;
  }
  if (filters?.month) {
    query += ` AND to_char(t.occurred_at, 'YYYY-MM') = $${idx}`;
    params.push(filters.month);
    idx++;
  }

  query += " ORDER BY t.occurred_at DESC, t.created_at DESC";
  const { rows } = await pool.query(query, params);
  return rows;
}

export async function createTransaction(
  userId: string,
  data: { accountId: string; categoryId?: string | null; amount: number; type: TransactionRow["type"]; description?: string | null; occurredAt: string }
) {
  const { rows } = await pool.query(
    `INSERT INTO transactions (account_id, category_id, amount, type, description, occurred_at)
     SELECT $1, $2, $3, $4, $5, $6
     FROM accounts a
     WHERE a.id = $1 AND a.user_id = $7
     RETURNING id, account_id, category_id, amount, type, description, occurred_at, created_at`,
    [data.accountId, data.categoryId ?? null, data.amount, data.type, data.description ?? null, data.occurredAt, userId]
  );
  return rows[0] ?? null;
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  data: { amount?: number; type?: TransactionRow["type"]; description?: string | null; occurredAt?: string; categoryId?: string | null }
) {
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];
  let idx = 1;

  if (data.amount !== undefined) {
    setClauses.push(`amount = $${idx}`);
    params.push(data.amount);
    idx++;
  }
  if (data.type !== undefined) {
    setClauses.push(`type = $${idx}`);
    params.push(data.type);
    idx++;
  }
  if (data.description !== undefined) {
    setClauses.push(`description = $${idx}`);
    params.push(data.description);
    idx++;
  }
  if (data.occurredAt !== undefined) {
    setClauses.push(`occurred_at = $${idx}`);
    params.push(data.occurredAt);
    idx++;
  }
  if (data.categoryId !== undefined) {
    setClauses.push(`category_id = $${idx}`);
    params.push(data.categoryId);
    idx++;
  }

  if (setClauses.length === 0) return null;

  params.push(transactionId, userId);
  const { rows } = await pool.query(
    `UPDATE transactions t
     SET ${setClauses.join(", ")}
     FROM accounts a
     WHERE t.id = $${idx}
       AND a.id = t.account_id
       AND a.user_id = $${idx + 1}
     RETURNING t.id, t.account_id, t.category_id, t.amount, t.type, t.description, t.occurred_at, t.created_at`,
    params
  );
  return rows[0] ?? null;
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const { rowCount } = await pool.query(
    `DELETE FROM transactions t
     USING accounts a
     WHERE t.id = $1
       AND a.id = t.account_id
       AND a.user_id = $2`,
    [transactionId, userId]
  );
  return (rowCount ?? 0) > 0;
}

export async function getMonthlyExpensesByCategory(userId: string, yearMonth: string) {
  const { rows } = await pool.query(
    `SELECT c.name, c.color, SUM(t.amount) as total
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     JOIN categories c ON c.id = t.category_id
     WHERE a.user_id = $1
       AND t.type = 'despesa'
       AND to_char(t.occurred_at, 'YYYY-MM') = $2
     GROUP BY c.name, c.color
     ORDER BY total DESC`,
    [userId, yearMonth]
  );
  return rows;
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
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
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
