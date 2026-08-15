import { pool } from "@/lib/db";

export type InvestmentRow = {
  id: string;
  account_id: string;
  name: string;
  invested_amount: string;
  current_value: string;
  updated_at: string;
};

export async function getInvestmentsByAccount(accountId: string): Promise<InvestmentRow[]> {
  const { rows } = await pool.query(
    "SELECT id, account_id, name, invested_amount, current_value, updated_at FROM investments WHERE account_id = $1 ORDER BY updated_at DESC",
    [accountId]
  );
  return rows;
}

export async function upsertInvestment(
  accountId: string,
  data: { name: string; investedAmount: number; currentValue: number }
) {
  const { rows } = await pool.query(
    `INSERT INTO investments (account_id, name, invested_amount, current_value, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (account_id, name) DO UPDATE
       SET invested_amount = EXCLUDED.invested_amount,
           current_value = EXCLUDED.current_value,
           updated_at = now()
     RETURNING id, account_id, name, invested_amount, current_value, updated_at`,
    [accountId, data.name, data.investedAmount, data.currentValue]
  );
  return rows[0];
}
