import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { inscreverPorAdmin } from "@/lib/pelada-service";
import { Posicao } from "@/types";

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
    const { peladaId, pessoaId, posicao } = body ?? {};

    if (!peladaId || !pessoaId || !["goleiro", "jogador"].includes(posicao)) {
      return NextResponse.json(
        { message: "Informe a lista, o jogador e a posição." },
        { status: 400 },
      );
    }

    const { pelada } = await inscreverPorAdmin(
      peladaId,
      pessoaId,
      posicao as Posicao,
    );
    return NextResponse.json({
      message: "Jogador adicionado à lista.",
      pelada,
    });
  } catch (error: unknown) {
    console.error("[lista/admin/adicionar] erro:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível adicionar o jogador.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
