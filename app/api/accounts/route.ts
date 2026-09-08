export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccountsByUser, createAccount } from "@/lib/queries/accounts";

const VALID_TYPES = ["corrente", "poupanca", "investimento"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const accounts = await getAccountsByUser(session.user.id);
  return NextResponse.json(accounts);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, type, currency } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Nome e tipo são obrigatórios" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Tipo inválido. Use um de: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const account = await createAccount(session.user.id, {
    name,
    type,
    currency: currency ?? "BRL",
  });

  return NextResponse.json(account, { status: 201 });
}