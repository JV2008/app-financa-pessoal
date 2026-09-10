import { sql } from "@/lib/db";

export type AccountRow = {
  id: string;
  user_id: string;
  name: string;
  type: "corrente" | "poupanca" | "investimento";
  currency: string;
  created_at: string;
  balance?: number;
};

export async function getAccountsByUser(userId: string): Promise<(AccountRow & { balance: number })[]> {
  const rows = await sql`
    SELECT 
      a.id, 
      a.user_id, 
      a.name, 
      a.type, 
      a.currency, 
      a.created_at,
      COALESCE(SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE -t.amount END), 0) as balance
    FROM account a
    LEFT JOIN transaction t ON a.id = t.account_id
    WHERE a.user_id = ${userId}
    GROUP BY a.id, a.user_id, a.name, a.type, a.currency, a.created_at
    ORDER BY a.created_at DESC
  `;
  return rows.map((r: any) => ({
    ...r,
    balance: Number(r.balance ?? 0),
  }));
}

export async function createAccount(
  userId: string,
  data: { name: string; type: AccountRow["type"]; currency?: string }
) {
  const [row] = await sql`
    INSERT INTO account (user_id, name, type, currency)
    VALUES (${userId}, ${data.name}, ${data.type}, ${data.currency ?? "BRL"})
    RETURNING id, user_id, name, type, currency, created_at
  `;
  return row;
}

export async function getAccountById(accountId: string) {
  const [row] = await sql`
    SELECT id, user_id, name, type, currency, created_at
    FROM account
    WHERE id = ${accountId}
  `;
  return row ?? null;
}