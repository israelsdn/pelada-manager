import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarPessoas } from "@/lib/pessoa-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem ver essa página." },
      { status: 403 }
    );
  }

  try {
    const pessoas = await listarPessoas();
    return NextResponse.json({ pessoas });
  } catch (error) {
    console.error("[usuarios GET] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar os usuários." },
      { status: 500 }
    );
  }
}
