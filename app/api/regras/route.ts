import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { atualizarRegras, buscarRegras } from "@/lib/regras-service";

// Pública de propósito: qualquer pessoa pode ler as regras, sem precisar logar.
export async function GET() {
  try {
    const regras = await buscarRegras();
    return NextResponse.json({ regras });
  } catch (error) {
    console.error("[regras GET] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar as regras." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem editar as regras." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const conteudo = typeof body?.conteudo === "string" ? body.conteudo.trim() : "";

    if (!conteudo) {
      return NextResponse.json(
        { message: "O conteúdo das regras não pode ficar vazio." },
        { status: 400 }
      );
    }

    const regras = await atualizarRegras(conteudo, session.user.id);
    return NextResponse.json({ regras });
  } catch (error) {
    console.error("[regras PUT] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível salvar as regras." },
      { status: 500 }
    );
  }
}
