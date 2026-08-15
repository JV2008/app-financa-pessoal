export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTransactionsByUser, createTransaction } from "@/lib/queries/transactions";
import { getAccountsByUser } from "@/lib/queries/accounts";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const month = searchParams.get("month") || undefined;

  const transactions = await getTransactionsByUser(session.user.id, {
    accountId,
    categoryId,
    startDate,
    endDate,
    month,
  });

  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { accountId, categoryId, amount, type, description, occurredAt } = body;

  if (!accountId || !amount || !type || !occurredAt) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const accounts = await getAccountsByUser(session.user.id);
  const account = accounts.find((a) => a.id === accountId);
  if (!account) {
    return NextResponse.json({ error: "Conta inválida" }, { status: 400 });
  }

  const transaction = await createTransaction(session.user.id, {
    accountId,
    categoryId: categoryId ?? null,
    amount: Number(amount),
    type,
    description: description ?? null,
    occurredAt,
  });

  return NextResponse.json(transaction, { status: 201 });
}
