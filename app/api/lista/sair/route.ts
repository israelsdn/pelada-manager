import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sairDaPelada } from "@/lib/pelada-service";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { peladaId } = body ?? {};

    if (!peladaId) {
      return NextResponse.json({ message: "Informe a lista." }, { status: 400 });
    }

    const { resultado, pelada } = await sairDaPelada(peladaId, session.user.id);

    const mensagem = resultado.promovido
      ? "Você saiu da lista. Um suplente foi promovido para o seu lugar."
      : "Você saiu da lista.";

    return NextResponse.json({ message: mensagem, pelada, resultado });
  } catch (error: any) {
    console.error("[lista/sair] erro:", error);
    const message = error?.message ?? "Não foi possível sair da lista.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
