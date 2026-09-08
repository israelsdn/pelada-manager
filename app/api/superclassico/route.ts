import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarEdicoesSuperclassico,
  registrarEdicaoSuperclassico,
} from "@/lib/superclassico-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const edicoes = await listarEdicoesSuperclassico();
    return NextResponse.json({ edicoes });
  } catch (error) {
    console.error("[superclassico GET] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar o Superclássico." },
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
      { message: "Apenas administradores podem registrar vencedores." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { data, pessoaIds } = body ?? {};
    const edicao = await registrarEdicaoSuperclassico(
      session.user.id,
      String(data ?? ""),
      Array.isArray(pessoaIds) ? pessoaIds : [],
    );
    return NextResponse.json({ edicao }, { status: 201 });
  } catch (error: unknown) {
    console.error("[superclassico POST] erro:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível registrar os vencedores.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
