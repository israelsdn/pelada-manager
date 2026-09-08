import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { atualizarPessoa, buscarPessoaPorId } from "@/lib/pessoa-service";
import { validarFotoBase64 } from "@/lib/foto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const pessoa = await buscarPessoaPorId(session.user.id);
    if (!pessoa) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      pessoa: {
        id: pessoa.id,
        nomeCompleto: pessoa.nomeCompleto,
        apelido: pessoa.apelido,
        foto: pessoa.foto ?? null,
      },
    });
  } catch (error) {
    console.error("[perfil GET] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar o perfil." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const dados: Parameters<typeof atualizarPessoa>[1] = {};

    if (body.nomeCompleto !== undefined) {
      if (!String(body.nomeCompleto).trim()) {
        return NextResponse.json(
          { message: "Nome completo não pode ficar vazio." },
          { status: 400 },
        );
      }
      dados.nomeCompleto = String(body.nomeCompleto).trim();
    }

    if (body.apelido !== undefined) {
      if (!String(body.apelido).trim()) {
        return NextResponse.json(
          { message: "Apelido não pode ficar vazio." },
          { status: 400 },
        );
      }
      dados.apelido = String(body.apelido).trim();
    }

    if (body.foto !== undefined) {
      try {
        dados.foto = validarFotoBase64(body.foto);
      } catch (erro) {
        const message =
          erro instanceof Error ? erro.message : "Foto inválida.";
        return NextResponse.json({ message }, { status: 400 });
      }
    }

    const pessoa = await atualizarPessoa(session.user.id, dados);
    if (!pessoa) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      pessoa: {
        id: pessoa.id,
        nomeCompleto: pessoa.nomeCompleto,
        apelido: pessoa.apelido,
        foto: pessoa.foto ?? null,
      },
    });
  } catch (error) {
    console.error("[perfil PATCH] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível salvar o perfil." },
      { status: 500 },
    );
  }
}
