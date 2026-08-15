import { pool } from "@/lib/db";

export type CategoryRow = {
  id: string;
  user_id: string | null;
  name: string;
  type: "receita" | "despesa";
  color: string | null;
};

export async function getCategoriesByUser(userId: string): Promise<CategoryRow[]> {
  const { rows } = await pool.query(
    "SELECT id, user_id, name, type, color FROM categories WHERE user_id = $1 OR user_id IS NULL ORDER BY type, name",
    [userId]
  );
  return rows;
}
