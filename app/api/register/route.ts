import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // 1. Verificar se o e-mail já está cadastrado
    const [existingUser] = await sql`
          SELECT id FROM neon_auth."user" WHERE email = ${email}
        `;

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso." },
        { status: 400 }
      );
    }

    // 2. Gerar hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const accountId = randomUUID();
    const now = new Date();
    // 3. 1º INSERT: Criar o Usuário
    const [newUser] = await sql`
          INSERT INTO neon_auth."user" (id, name, email, created_at, updated_at)
          VALUES (${userId}, ${name}, ${email}, ${now}, ${now})
          RETURNING id, name, email
        `;

    // 4. 2º INSERT: Salvar a Senha/Credencial na tabela account
    await sql`
          INSERT INTO neon_auth.account (
            id,
            user_id,
            account_id,
            provider_id,
            password,
            created_at,
            updated_at
          )
          VALUES (
            ${accountId},
            ${newUser.id},
            ${newUser.id},
            'credential',
            ${hashedPassword},
            ${now},
            ${now}
          )
        `;

    return NextResponse.json(
      { message: "Usuário cadastrado com sucesso!", user: newUser },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao cadastrar usuário." },
      { status: 500 }
    );
  }
}
