import { sql } from "@/lib/db";

export type AccountRow = {
  id: string;
  user_id: string;
  name: string;
  type: "corrente" | "poupanca" | "investimento";
  currency: string;
  created_at: string;
};

export async function getAccountsByUser(userId: string): Promise<AccountRow[]> {
  const rows = await sql`
    SELECT id, user_id, name, type, currency, created_at
    FROM account
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return rows as AccountRow[];
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