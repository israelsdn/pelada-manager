import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { onlyDigits } from "@/lib/phone";
import { Pessoa } from "@/types";

interface LinhaPessoa {
  id: string;
  nome_completo: string;
  apelido: string;
  telefone: string;
  ativo: number | boolean;
  administrador: number | boolean;
  gols: number;
  assistencias: number;
  foto?: string | null;
}

function linhaParaPessoa(row: LinhaPessoa): Pessoa {
  return {
    id: row.id,
    nomeCompleto: row.nome_completo,
    apelido: row.apelido,
    telefone: row.telefone,
    ativo: !!row.ativo,
    administrador: !!row.administrador,
    gols: Number(row.gols),
    assistencias: Number(row.assistencias),
    foto: row.foto ?? null,
  };
}

export async function buscarPessoaPorTelefone(
  telefone: string
): Promise<Pessoa | null> {
  const [rows] = await pool.execute(
    "SELECT * FROM pessoas WHERE telefone = ? LIMIT 1",
    [onlyDigits(telefone)]
  );
  const linhas = rows as LinhaPessoa[];
  return linhas[0] ? linhaParaPessoa(linhas[0]) : null;
}

export async function buscarPessoaPorId(id: string): Promise<Pessoa | null> {
  const [rows] = await pool.execute("SELECT * FROM pessoas WHERE id = ? LIMIT 1", [
    id,
  ]);
  const linhas = rows as LinhaPessoa[];
  return linhas[0] ? linhaParaPessoa(linhas[0]) : null;
}

export async function criarPessoa(dados: {
  nomeCompleto: string;
  apelido: string;
  telefone: string;
}): Promise<Pessoa> {
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO pessoas (id, nome_completo, apelido, telefone, ativo, administrador)
     VALUES (?, ?, ?, ?, FALSE, FALSE)`,
    [id, dados.nomeCompleto.trim(), dados.apelido.trim(), onlyDigits(dados.telefone)]
  );
  return (await buscarPessoaPorId(id))!;
}

export async function listarPessoas(): Promise<Pessoa[]> {
  const [rows] = await pool.execute(
    "SELECT * FROM pessoas ORDER BY nome_completo ASC"
  );
  return (rows as LinhaPessoa[]).map(linhaParaPessoa);
}

export interface AtualizacaoPessoa {
  nomeCompleto?: string;
  apelido?: string;
  telefone?: string;
  ativo?: boolean;
  administrador?: boolean;
  gols?: number;
  assistencias?: number;
  foto?: string | null;
}

const MAPA_COLUNAS: Record<keyof AtualizacaoPessoa, string> = {
  nomeCompleto: "nome_completo",
  apelido: "apelido",
  telefone: "telefone",
  ativo: "ativo",
  administrador: "administrador",
  gols: "gols",
  assistencias: "assistencias",
  foto: "foto",
};

export async function atualizarPessoa(
  id: string,
  dados: AtualizacaoPessoa
): Promise<Pessoa | null> {
  const campos: string[] = [];
  const valores: unknown[] = [];

  for (const chave of Object.keys(dados) as (keyof AtualizacaoPessoa)[]) {
    const valor = dados[chave];
    if (valor === undefined) continue;
    const coluna = MAPA_COLUNAS[chave];
    campos.push(`${coluna} = ?`);
    valores.push(chave === "telefone" ? onlyDigits(String(valor)) : valor);
  }

  if (!campos.length) return buscarPessoaPorId(id);

  valores.push(id);
  await pool.execute(`UPDATE pessoas SET ${campos.join(", ")} WHERE id = ?`, valores);
  return buscarPessoaPorId(id);
}

export interface LinhaRanking extends Pessoa {
  superclassicos: number;
}

export async function rankingGolsAssistencias(): Promise<LinhaRanking[]> {
  const [rows] = await pool.execute(
    `SELECT p.*, COALESCE(s.total, 0) AS superclassicos
     FROM pessoas p
     LEFT JOIN (
       SELECT pessoa_id, COUNT(*) AS total
       FROM superclassico_vencedores
       GROUP BY pessoa_id
     ) s ON s.pessoa_id = p.id
     ORDER BY p.gols DESC, p.assistencias DESC, superclassicos DESC, p.apelido ASC`,
  );
  return (rows as (LinhaPessoa & { superclassicos: number | string })[]).map(
    (row) => ({
      ...linhaParaPessoa(row),
      superclassicos: Number(row.superclassicos),
    }),
  );
}
