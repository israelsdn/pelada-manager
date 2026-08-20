import { pool } from "@/lib/db";
import { Regras } from "@/types";

interface LinhaRegras {
  conteudo: string;
  atualizado_em: Date;
  atualizado_por_apelido: string | null;
}

export async function buscarRegras(): Promise<Regras> {
  const [rows] = await pool.execute(
    `SELECT r.conteudo, r.atualizado_em, p.apelido AS atualizado_por_apelido
     FROM regras r
     LEFT JOIN pessoas p ON p.id = r.atualizado_por
     WHERE r.id = 1`
  );
  const linha = (rows as LinhaRegras[])[0];

  if (!linha) {
    return {
      conteudo: "Regras ainda não cadastradas.",
      atualizadoEm: new Date().toISOString(),
    };
  }

  return {
    conteudo: linha.conteudo,
    atualizadoEm: new Date(linha.atualizado_em).toISOString(),
    atualizadoPorApelido: linha.atualizado_por_apelido ?? undefined,
  };
}

export async function atualizarRegras(
  conteudo: string,
  atualizadoPorId: string
): Promise<Regras> {
  await pool.execute(
    `INSERT INTO regras (id, conteudo, atualizado_por)
     VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE conteudo = VALUES(conteudo), atualizado_por = VALUES(atualizado_por)`,
    [conteudo, atualizadoPorId]
  );
  return buscarRegras();
}
