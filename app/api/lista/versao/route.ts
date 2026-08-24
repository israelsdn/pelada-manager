import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buscarVersaoPeladaAtual } from "@/lib/pelada-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const versao = await buscarVersaoPeladaAtual();
    return NextResponse.json({ versao });
  } catch (error) {
    console.error("[lista/versao] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível verificar a lista." },
      { status: 500 },
    );
  }
}
