import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { NotaMensal, Voto } from "@/types";

const TZ = "America/Fortaleza";

function formatarDataHoraBR(data: Date | string): string {
  return new Date(data).toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function partesFortaleza(data: Date): { year: number; month: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(data)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return { year: Number(parts.year), month: Number(parts.month) };
}

function inicioFimMesAtual(agora: Date = new Date()) {
  const { year, month } = partesFortaleza(agora);
  const pad = (n: number) => String(n).padStart(2, "0");
  const inicio = new Date(`${year}-${pad(month)}-01T00:00:00-03:00`);
  const proximoMes = month === 12 ? 1 : month + 1;
  const proximoAno = month === 12 ? year + 1 : year;
  const fim = new Date(`${proximoAno}-${pad(proximoMes)}-01T00:00:00-03:00`);
  return { inicio, fim, year, month };
}

export function rotuloMesAtual(agora: Date = new Date()): string {
  const { year, month } = partesFortaleza(agora);
  const rotulo = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}

export async function listarVotosDoAdmin(
  peladaId: string,
  votanteId: string,
): Promise<Voto[]> {
  const [rows] = await pool.execute(
    `SELECT votado_id, nota
     FROM votos
     WHERE pelada_id = ? AND votante_id = ?`,
    [peladaId, votanteId],
  );
  return (rows as { votado_id: string; nota: number }[]).map((row) => ({
    votadoId: row.votado_id,
    nota: Number(row.nota),
  }));
}

export async function listarNotasDoMes(
  agora: Date = new Date(),
): Promise<NotaMensal[]> {
  const { inicio, fim } = inicioFimMesAtual(agora);
  const [rows] = await pool.execute(
    `SELECT p.id AS pessoa_id, p.apelido,
            AVG(v.nota) AS media,
            COUNT(v.id) AS total_votos
     FROM votos v
     JOIN pessoas p ON p.id = v.votado_id
     JOIN peladas pl ON pl.id = v.pelada_id
     WHERE pl.dia_evento >= ? AND pl.dia_evento < ?
     GROUP BY p.id, p.apelido
     ORDER BY media DESC, p.apelido ASC`,
    [inicio, fim],
  );

  return (
    rows as {
      pessoa_id: string;
      apelido: string;
      media: number | string;
      total_votos: number | string;
    }[]
  ).map((row) => ({
    pessoaId: row.pessoa_id,
    apelido: row.apelido,
    media: Number(Number(row.media).toFixed(1)),
    totalVotos: Number(row.total_votos),
  }));
}

/**
 * Salva (ou atualiza) as notas de quem participou da pelada.
 * Só vale entre dia_evento e data_fim, e só para quem está na lista.
 */
export async function registrarVotos(
  peladaId: string,
  votanteId: string,
  votos: Voto[],
): Promise<Voto[]> {
  if (!votos.length) {
    throw new Error("Informe pelo menos uma nota.");
  }

  const normalizados = votos.map((voto) => {
    const nota = Number(voto.nota);
    if (!Number.isInteger(nota) || nota < 0 || nota > 10) {
      throw new Error("A nota precisa ser um número inteiro de 0 a 10.");
    }
    if (!voto.votadoId) {
      throw new Error("Informe o jogador votado.");
    }
    return { votadoId: String(voto.votadoId), nota };
  });

  const idsUnicos = new Set(normalizados.map((v) => v.votadoId));
  if (idsUnicos.size !== normalizados.length) {
    throw new Error("Há notas duplicadas para o mesmo jogador.");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [peladaRows] = await conn.execute(
      "SELECT id, dia_evento, data_fim FROM peladas WHERE id = ? LIMIT 1",
      [peladaId],
    );
    const peladaRow = (
      peladaRows as { id: string; dia_evento: Date; data_fim: Date }[]
    )[0];
    if (!peladaRow) {
      throw new Error("Lista não encontrada.");
    }

    if (new Date(peladaRow.dia_evento).getTime() > Date.now()) {
      throw new Error(
        `A votação abre a partir do início da pelada (${formatarDataHoraBR(peladaRow.dia_evento)}).`,
      );
    }

    if (new Date(peladaRow.data_fim).getTime() < Date.now()) {
      throw new Error(
        `O prazo de votação dessa pelada já encerrou (terminou às ${formatarDataHoraBR(peladaRow.data_fim)}).`,
      );
    }

    const [votanteRows] = await conn.execute(
      "SELECT id FROM inscricoes WHERE pelada_id = ? AND pessoa_id = ? LIMIT 1",
      [peladaId, votanteId],
    );
    if (!(votanteRows as unknown[]).length) {
      throw new Error(
        "Só quem participou dessa pelada pode votar.",
      );
    }

    const idsParaValidar = [...idsUnicos];
    const [inscritosRows] = await conn.query(
      "SELECT pessoa_id FROM inscricoes WHERE pelada_id = ? AND pessoa_id IN (?)",
      [peladaId, idsParaValidar],
    );
    const encontrados = new Set(
      (inscritosRows as { pessoa_id: string }[]).map((r) => r.pessoa_id),
    );
    const faltando = idsParaValidar.filter((id) => !encontrados.has(id));
    if (faltando.length) {
      throw new Error(
        "Só é possível votar em pessoas que estão na lista dessa pelada.",
      );
    }

    for (const voto of normalizados) {
      const id = randomUUID();
      await conn.execute(
        `INSERT INTO votos (id, pelada_id, votante_id, votado_id, nota)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nota = VALUES(nota)`,
        [id, peladaId, votanteId, voto.votadoId, voto.nota],
      );
    }

    await conn.commit();
    return listarVotosDoAdmin(peladaId, votanteId);
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}
