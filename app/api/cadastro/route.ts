import { NextRequest, NextResponse } from "next/server";
import { buscarPessoaPorTelefone, criarPessoa } from "@/lib/pessoa-service";
import { isValidPhone, onlyDigits } from "@/lib/phone";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nomeCompleto, apelido, telefone } = body ?? {};

    if (!nomeCompleto?.trim() || !apelido?.trim() || !telefone?.trim()) {
      return NextResponse.json(
        { message: "Nome completo, apelido e telefone são obrigatórios." },
        { status: 400 }
      );
    }

    if (!isValidPhone(telefone)) {
      return NextResponse.json(
        { message: "Telefone inválido. Use o formato (xx) x xxxx-xxxx." },
        { status: 400 }
      );
    }

    const existente = await buscarPessoaPorTelefone(onlyDigits(telefone));
    if (existente) {
      return NextResponse.json(
        { message: "Já existe um cadastro com esse telefone." },
        { status: 409 }
      );
    }

    const pessoa = await criarPessoa({ nomeCompleto, apelido, telefone });

    return NextResponse.json(
      {
        message:
          "Cadastro realizado! Aguarde a ativação da administração para poder entrar.",
        pessoa,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[cadastro] erro:", error);
    return NextResponse.json(
      { message: "Não foi possível concluir o cadastro. Tente novamente." },
      { status: 500 }
    );
  }
}
