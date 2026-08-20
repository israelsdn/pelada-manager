import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rankingGolsAssistencias } from "@/lib/pessoa-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const pessoas = await rankingGolsAssistencias();
    // Só expõe o necessário para o ranking - não vaza telefone de todo mundo.
    const ranking = pessoas.map((p) => ({
      id: p.id,
      apelido: p.apelido,
      gols: p.gols,
      assistencias: p.assistencias,
    }));
    return NextResponse.json({ ranking });
  } catch (error) {
    console.error("[ranking] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar o ranking." },
      { status: 500 }
    );
  }
}
