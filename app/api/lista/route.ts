import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buscarPeladaAtual } from "@/lib/pelada-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const pelada = await buscarPeladaAtual();
    return NextResponse.json({ pelada });
  } catch (error: any) {
    console.error("[lista] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar a lista." },
      { status: 500 },
    );
  }
}
