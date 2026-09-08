import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarNotasDoMes, rotuloMesAtual } from "@/lib/votacao-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem ver as notas." },
      { status: 403 },
    );
  }

  try {
    const notas = await listarNotasDoMes();
    return NextResponse.json({
      mes: rotuloMesAtual(),
      notas,
    });
  } catch (error) {
    console.error("[votacao/notas GET] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar as notas do mês." },
      { status: 500 },
    );
  }
}
