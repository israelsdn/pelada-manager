import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removerEdicaoSuperclassico } from "@/lib/superclassico-service";

interface RouteParams {
  params: { id: string };
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem remover uma edição." },
      { status: 403 },
    );
  }

  try {
    await removerEdicaoSuperclassico(params.id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[superclassico DELETE] erro:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível remover a edição.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
