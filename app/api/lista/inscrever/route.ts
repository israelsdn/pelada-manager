import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { inscreverNaPelada } from "@/lib/pelada-service";
import { gravarDeviceIdNaResposta, obterOuCriarDeviceId } from "@/lib/device";
import { Posicao } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const { deviceId, novo } = obterOuCriarDeviceId(req);

  try {
    const body = await req.json();
    const { peladaId, posicao } = body ?? {};

    if (!peladaId || !["goleiro", "jogador"].includes(posicao)) {
      const res = NextResponse.json(
        { message: "Informe a lista e a posição (goleiro ou jogador)." },
        { status: 400 }
      );
      if (novo) gravarDeviceIdNaResposta(res, deviceId);
      return res;
    }

    const { resultado, pelada } = await inscreverNaPelada(
      peladaId,
      session.user.id,
      posicao as Posicao,
      deviceId
    );

    const mensagem =
      resultado.destino === "listaSuplentes"
        ? `A lista de ${posicao === "goleiro" ? "goleiros" : "jogadores"} já está cheia — você entrou na lista de suplentes.`
        : "Inscrição confirmada!";

    const res = NextResponse.json({ message: mensagem, pelada, resultado });
    if (novo) gravarDeviceIdNaResposta(res, deviceId);
    return res;
  } catch (error: any) {
    console.error("[lista/inscrever] erro:", error);
    const message = error?.message ?? "Não foi possível concluir a inscrição.";
    const res = NextResponse.json({ message }, { status: 400 });
    if (novo) gravarDeviceIdNaResposta(res, deviceId);
    return res;
  }
}
