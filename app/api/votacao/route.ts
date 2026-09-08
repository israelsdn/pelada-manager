import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarVotosDoAdmin, registrarVotos } from "@/lib/votacao-service";
import { Voto } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const peladaId = req.nextUrl.searchParams.get("peladaId");
  if (!peladaId) {
    return NextResponse.json({ message: "Informe peladaId." }, { status: 400 });
  }

  try {
    const votos = await listarVotosDoAdmin(peladaId, session.user.id);
    return NextResponse.json({ votos });
  } catch (error) {
    console.error("[votacao GET] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar os votos." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { peladaId, votos } = body ?? {};

    if (!peladaId) {
      return NextResponse.json(
        { message: "Informe a lista." },
        { status: 400 },
      );
    }
    if (!Array.isArray(votos)) {
      return NextResponse.json(
        { message: "Informe as notas." },
        { status: 400 },
      );
    }

    const salvos = await registrarVotos(
      peladaId,
      session.user.id,
      votos as Voto[],
    );
    return NextResponse.json({ votos: salvos }, { status: 201 });
  } catch (error: unknown) {
    console.error("[votacao POST] erro:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível salvar os votos.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
