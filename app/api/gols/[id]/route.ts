import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removerEventoGol } from "@/lib/gol-service";

interface RouteParams {
  params: { id: string };
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem remover gols." },
      { status: 403 },
    );
  }

  try {
    await removerEventoGol(params.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[gols DELETE] erro:", error);
    const message = error?.message ?? "Não foi possível remover o gol.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
