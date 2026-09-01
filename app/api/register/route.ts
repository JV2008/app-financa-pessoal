export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createAccount } from "@/lib/queries/accounts";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 });
    }

    const [existing] = await sql`SELECT id FROM "user" WHERE email = ${email}`;
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [row] = await sql`
      INSERT INTO "user" (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id
    `;

    const userId = row.id;
    await createAccount(userId, { name: "Conta Principal", type: "corrente" });

    return NextResponse.json({ userId }, { status: 201 });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}