import { sql } from "@/lib/db";

export type InvestmentRow = {
  id: string;
  account_id: string;
  name: string;
  invested_amount: string;
  current_value: string;
  updated_at: string;
};

export async function getInvestmentsByAccount(accountId: string): Promise<InvestmentRow[]> {
  const rows = await sql`
    SELECT id, account_id, name, invested_amount, current_value, updated_at
    FROM investment
    WHERE account_id = ${accountId}
    ORDER BY updated_at DESC
  `;
  return rows as InvestmentRow[];
}

export async function upsertInvestment(
  accountId: string,
  data: { name: string; investedAmount: number; currentValue: number }
) {
  const [row] = await sql`
    INSERT INTO investment (account_id, name, invested_amount, current_value, updated_at)
    VALUES (${accountId}, ${data.name}, ${data.investedAmount}, ${data.currentValue}, now())
    ON CONFLICT (account_id, name) DO UPDATE
      SET invested_amount = EXCLUDED.invested_amount,
          current_value = EXCLUDED.current_value,
          updated_at = now()
    RETURNING id, account_id, name, invested_amount, current_value, updated_at
  `;
  return row;
}