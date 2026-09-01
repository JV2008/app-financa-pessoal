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
          INSERT INTO neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
          VALUES (${userId}, ${name}, ${email}, false, ${now}, ${now})
          RETURNING id, name, email
        `;

    // 4. 2º INSERT: Salvar a Senha/Credencial na tabela account
    await sql`
          INSERT INTO neon_auth.account (
            id,
            "userId",
            "accountId",
            "providerId",
            password,
            "createdAt",
            "updatedAt"
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


authorize: async (credentials: Record<string, string> | undefined) => {
  const email = credentials?.email as string | undefined;
  const password = credentials?.password as string | undefined;


  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  // Busca o usuário e a senha vinculada na tabela account
  const [user] = await sql`
        SELECT
          u.id,
          u.email,
          u.name,
          a.password AS password_hash
        FROM neon_auth."user" u
        INNER JOIN neon_auth.account a ON a."userId" = u.id
        WHERE u.email = ${credentials.email}
          AND a."providerId" = 'credential'
        LIMIT 1
      `;

  if (!user || !user.password_hash) {
    return null;
  }

  const isValid = await bcrypt.compare(credentials.password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
