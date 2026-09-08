import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarNomesCompletosDaPelada } from "@/lib/pelada-service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem copiar os nomes da lista." },
      { status: 403 },
    );
  }

  const peladaId = req.nextUrl.searchParams.get("peladaId");
  if (!peladaId) {
    return NextResponse.json({ message: "Informe peladaId." }, { status: 400 });
  }

  try {
    const nomes = await listarNomesCompletosDaPelada(peladaId);
    return NextResponse.json({ nomes });
  } catch (error) {
    console.error("[lista/nomes GET] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar os nomes." },
      { status: 500 },
    );
  }
}
