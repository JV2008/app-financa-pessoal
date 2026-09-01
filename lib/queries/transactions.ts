import { sql } from "@/lib/db";

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
  const conditions: string[] = [`a.user_id = ${userId}`];
  const values: (string | undefined)[] = [];

  if (filters?.accountId) {
    conditions.push(`t.account_id = $${values.length + 1}`);
    values.push(filters.accountId);
  }
  if (filters?.categoryId) {
    conditions.push(`t.category_id = $${values.length + 1}`);
    values.push(filters.categoryId);
  }
  if (filters?.startDate) {
    conditions.push(`t.occurred_at >= $${values.length + 1}`);
    values.push(filters.startDate);
  }
  if (filters?.endDate) {
    conditions.push(`t.occurred_at <= $${values.length + 1}`);
    values.push(filters.endDate);
  }
  if (filters?.month) {
    conditions.push(`to_char(t.occurred_at, 'YYYY-MM') = $${values.length + 1}`);
    values.push(filters.month);
  }

  const query = `
    SELECT t.id, t.account_id, t.category_id, t.amount, t.type, t.description, t.occurred_at, t.created_at
    FROM neon_auth.transaction t
    JOIN neon_auth.account a ON a.id = t.account_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY t.occurred_at DESC, t.created_at DESC
  `;

  const rows = await sql.query(query, values);
  return rows;
}

export async function createTransaction(
  userId: string,
  data: { accountId: string; categoryId?: string | null; amount: number; type: TransactionRow["type"]; description?: string | null; occurredAt: string }
) {
  const [row] = await sql.query(`
    INSERT INTO neon_auth.transaction (account_id, category_id, amount, type, description, occurred_at)
    SELECT $1, $2, $3, $4, $5, $6
    FROM neon_auth.account a
    WHERE a.id = $1 AND a.user_id = $7
    RETURNING id, account_id, category_id, amount, type, description, occurred_at, created_at
  `, [data.accountId, data.categoryId ?? null, data.amount, data.type, data.description ?? null, data.occurredAt, userId]);
  return row ?? null;
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
  const [row] = await sql.query(`
    UPDATE transaction t
    SET ${setClauses.join(", ")}
    FROM account a
    WHERE t.id = $${idx}
      AND a.id = t.account_id
      AND a.user_id = $${idx + 1}
    RETURNING t.id, t.account_id, t.category_id, t.amount, t.type, t.description, t.occurred_at, t.created_at
  `, params);
  return row ?? null;
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const result = await sql.query(`
    DELETE FROM transaction t
    USING account a
    WHERE t.id = $1
      AND a.id = t.account_id
      AND a.user_id = $2
  `, [transactionId, userId], { fullResults: true });
  return (result.rowCount ?? 0) > 0;
}

export type MonthlyExpenseRow = {
  name: string;
  color: string;
  total: string;
};

export async function getMonthlyExpensesByCategory(userId: string, yearMonth: string): Promise<MonthlyExpenseRow[]> {
  const rows = await sql`
    SELECT c.name, c.color, SUM(t.amount) as total
    FROM transaction t
    JOIN account a ON a.id = t.account_id
    JOIN category c ON c.id = t.category_id
    WHERE a.user_id = ${userId}
      AND t.type = 'despesa'
      AND to_char(t.occurred_at, 'YYYY-MM') = ${yearMonth}
    GROUP BY c.name, c.color
    ORDER BY total DESC
  `;
  return rows as MonthlyExpenseRow[];
}

export async function getBalanceSummary(userId: string, accountId?: string) {
  if (accountId) {
    const [row] = await sql`
      SELECT
        SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE -t.amount END) as balance,
        SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'despesa' THEN t.amount ELSE 0 END) as expenses
      FROM transaction t
      JOIN account a ON a.id = t.account_id
      WHERE a.user_id = ${userId} AND t.account_id = ${accountId}
    `;
    return {
      balance: Number(row?.balance ?? 0),
      income: Number(row?.income ?? 0),
      expenses: Number(row?.expenses ?? 0),
    };
  }

  const [row] = await sql`
    SELECT
      SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE -t.amount END) as balance,
      SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.type = 'despesa' THEN t.amount ELSE 0 END) as expenses
    FROM transaction t
    JOIN account a ON a.id = t.account_id
    WHERE a.user_id = ${userId}
  `;
  return {
    balance: Number(row?.balance ?? 0),
    income: Number(row?.income ?? 0),
    expenses: Number(row?.expenses ?? 0),
  };
}