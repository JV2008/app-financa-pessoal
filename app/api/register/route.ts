export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { createAccount } from "@/lib/queries/accounts";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 });
    }

    const existing = await pool.query("SELECT id FROM \"user\" WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      "INSERT INTO \"user\" (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [name, email, passwordHash]
    );

    const userId = rows[0].id;
    await createAccount(userId, { name: "Conta Principal", type: "corrente" });

    return NextResponse.json({ userId }, { status: 201 });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}