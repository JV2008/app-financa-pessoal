// GET  -> lista investimentos do usuário autenticado
// POST -> cria/atualiza investimento
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([]);
}

export async function POST() {
  return NextResponse.json({});
}
