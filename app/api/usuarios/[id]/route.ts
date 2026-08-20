import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  atualizarPessoa,
  buscarPessoaPorId,
  buscarPessoaPorTelefone,
} from "@/lib/pessoa-service";
import { isValidPhone, onlyDigits } from "@/lib/phone";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.administrador) {
    return NextResponse.json(
      { message: "Apenas administradores podem editar usuários." },
      { status: 403 }
    );
  }

  const pessoaExistente = await buscarPessoaPorId(params.id);
  if (!pessoaExistente) {
    return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
  }

  try {
    const body = await req.json();
    const dados: Parameters<typeof atualizarPessoa>[1] = {};

    if (body.nomeCompleto !== undefined) {
      if (!String(body.nomeCompleto).trim()) {
        return NextResponse.json(
          { message: "Nome completo não pode ficar vazio." },
          { status: 400 }
        );
      }
      dados.nomeCompleto = String(body.nomeCompleto).trim();
    }

    if (body.apelido !== undefined) {
      if (!String(body.apelido).trim()) {
        return NextResponse.json(
          { message: "Apelido não pode ficar vazio." },
          { status: 400 }
        );
      }
      dados.apelido = String(body.apelido).trim();
    }

    if (body.telefone !== undefined) {
      if (!isValidPhone(body.telefone)) {
        return NextResponse.json(
          { message: "Telefone inválido." },
          { status: 400 }
        );
      }
      const outraPessoa = await buscarPessoaPorTelefone(onlyDigits(body.telefone));
      if (outraPessoa && outraPessoa.id !== params.id) {
        return NextResponse.json(
          { message: "Já existe outro cadastro com esse telefone." },
          { status: 409 }
        );
      }
      dados.telefone = body.telefone;
    }

    if (body.ativo !== undefined) dados.ativo = !!body.ativo;
    if (body.administrador !== undefined) dados.administrador = !!body.administrador;

    if (body.gols !== undefined) {
      const gols = Number(body.gols);
      if (!Number.isInteger(gols) || gols < 0) {
        return NextResponse.json(
          { message: "Gols precisa ser um número inteiro maior ou igual a 0." },
          { status: 400 }
        );
      }
      dados.gols = gols;
    }

    if (body.assistencias !== undefined) {
      const assistencias = Number(body.assistencias);
      if (!Number.isInteger(assistencias) || assistencias < 0) {
        return NextResponse.json(
          { message: "Assistências precisa ser um número inteiro maior ou igual a 0." },
          { status: 400 }
        );
      }
      dados.assistencias = assistencias;
    }

    const pessoa = await atualizarPessoa(params.id, dados);
    return NextResponse.json({ pessoa });
  } catch (error) {
    console.error("[usuarios PATCH] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível atualizar o usuário." },
      { status: 500 }
    );
  }
}
