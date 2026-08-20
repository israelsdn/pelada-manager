import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { abrirPelada, buscarPeladaAberta } from "@/lib/pelada-service";

function dataValida(valor: unknown): valor is string {
  return typeof valor === "string" && !Number.isNaN(new Date(valor).getTime());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem abrir a lista." },
      { status: 403 }
    );
  }

  try {
    const peladaExistente = await buscarPeladaAberta();
    if (peladaExistente) {
      return NextResponse.json(
        { message: "Já existe uma lista em aberto no momento." },
        { status: 409 }
      );
    }

    // Body opcional: admin pode customizar as 3 datas. Qualquer campo
    // ausente ou inválido cai para o valor padrão calculado pela regra.
    const body = await req.json().catch(() => ({}));
    const datasEscolhidas = {
      dataInicio: dataValida(body?.dataInicio) ? body.dataInicio : undefined,
      diaEvento: dataValida(body?.diaEvento) ? body.diaEvento : undefined,
      dataTermino: dataValida(body?.dataTermino) ? body.dataTermino : undefined,
    };

    const pelada = await abrirPelada(session.user.id, datasEscolhidas);
    return NextResponse.json({ pelada }, { status: 201 });
  } catch (error: any) {
    console.error("[lista/abrir] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível abrir a lista." },
      { status: 500 }
    );
  }
}
