export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccountsByUser } from "@/lib/queries/accounts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const accounts = await getAccountsByUser(session.user.id);
  return NextResponse.json(accounts);
}

export async function POST() {
  return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
}
