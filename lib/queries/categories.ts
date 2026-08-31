import { sql } from "@/lib/db";

export type CategoryRow = {
  id: string;
  user_id: string | null;
  name: string;
  type: "receita" | "despesa";
  color: string | null;
};

export async function getCategoriesByUser(userId: string): Promise<CategoryRow[]> {
  const rows = await sql`
    SELECT id, user_id, name, type, color
    FROM category
    WHERE user_id = ${userId} OR user_id IS NULL
    ORDER BY type, name
  `;
  return rows;
}