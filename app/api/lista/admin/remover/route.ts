import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sairDaPelada } from "@/lib/pelada-service";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem alterar a lista." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { peladaId, pessoaId } = body ?? {};

    if (!peladaId || !pessoaId) {
      return NextResponse.json(
        { message: "Informe a lista e o jogador." },
        { status: 400 },
      );
    }

    const { resultado, pelada } = await sairDaPelada(peladaId, pessoaId);
    const mensagem = resultado.promovido
      ? "Jogador removido da lista. Um suplente entrou no lugar."
      : "Jogador removido da lista.";

    return NextResponse.json({ message: mensagem, pelada, resultado });
  } catch (error: unknown) {
    console.error("[lista/admin/remover] erro:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível remover o jogador.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
