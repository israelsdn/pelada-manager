import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarEventosGol, registrarGol } from "@/lib/gol-service";

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
    const gols = await listarEventosGol(peladaId);
    return NextResponse.json({ gols });
  } catch (error) {
    console.error("[gols GET] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar os gols." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem registrar gols." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { peladaId, goleadorId, assistenteId } = body ?? {};

    if (!peladaId) {
      return NextResponse.json(
        { message: "Informe a lista." },
        { status: 400 },
      );
    }

    const evento = await registrarGol(
      peladaId,
      session.user.id,
      goleadorId || undefined,
      assistenteId || undefined,
    );
    return NextResponse.json({ evento }, { status: 201 });
  } catch (error: any) {
    console.error("[gols POST] erro:", error);
    const message = error?.message ?? "Não foi possível registrar o gol.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
