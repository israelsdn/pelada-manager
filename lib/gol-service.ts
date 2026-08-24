import { randomUUID } from "crypto";
import { pool } from "@/lib/db";

export interface EventoGol {
  id: string;
  peladaId: string;
  goleadorId?: string;
  goleadorApelido?: string;
  assistenteId?: string;
  assistenteApelido?: string;
  criadoEm: string;
}

interface LinhaEventoGol {
  id: string;
  pelada_id: string;
  goleador_id: string | null;
  goleador_apelido: string | null;
  assistente_id: string | null;
  assistente_apelido: string | null;
  criado_em: Date;
}

function paraEventoGol(row: LinhaEventoGol): EventoGol {
  return {
    id: row.id,
    peladaId: row.pelada_id,
    goleadorId: row.goleador_id ?? undefined,
    goleadorApelido: row.goleador_apelido ?? undefined,
    assistenteId: row.assistente_id ?? undefined,
    assistenteApelido: row.assistente_apelido ?? undefined,
    criadoEm: new Date(row.criado_em).toISOString(),
  };
}

export async function listarEventosGol(peladaId: string): Promise<EventoGol[]> {
  const [rows] = await pool.execute(
    `SELECT e.id, e.pelada_id,
            e.goleador_id, g.apelido AS goleador_apelido,
            e.assistente_id, a.apelido AS assistente_apelido,
            e.criado_em
     FROM eventos_gol e
     LEFT JOIN pessoas g ON g.id = e.goleador_id
     LEFT JOIN pessoas a ON a.id = e.assistente_id
     WHERE e.pelada_id = ?
     ORDER BY e.criado_em DESC`,
    [peladaId],
  );
  return (rows as LinhaEventoGol[]).map(paraEventoGol);
}

/** Comparações de "agora" nunca usam NOW() do SQL (que depende do fuso do
 * servidor MySQL) - sempre um new Date() calculado no Node. */
function formatarDataHoraBR(data: Date | string): string {
  return new Date(data).toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Registra um gol. Pelo menos um entre goleadorId/assistenteId precisa vir
 * preenchido. Ambos, quando informados, precisam ser pessoas que estejam na
 * lista dessa pelada (goleiros, jogadores ou suplentes) - checagem feita
 * aqui no servidor além do filtro já aplicado no dropdown do frontend.
 */
export async function registrarGol(
  peladaId: string,
  registradoPorId: string,
  goleadorId: string | undefined,
  assistenteId: string | undefined,
): Promise<EventoGol> {
  if (!goleadorId && !assistenteId) {
    throw new Error("Selecione quem fez o gol ou quem deu a assistência.");
  }
  if (goleadorId && assistenteId && goleadorId === assistenteId) {
    throw new Error("O goleador e o assistente não podem ser a mesma pessoa.");
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
        `Só é possível registrar gols a partir do início da pelada (${formatarDataHoraBR(peladaRow.dia_evento)}).`,
      );
    }

    if (new Date(peladaRow.data_fim).getTime() < Date.now()) {
      throw new Error(
        `O prazo para registrar gols dessa pelada já encerrou (terminou às ${formatarDataHoraBR(peladaRow.data_fim)}).`,
      );
    }

    const idsParaValidar = [goleadorId, assistenteId].filter(
      Boolean,
    ) as string[];
    if (idsParaValidar.length) {
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
          "Selecione apenas pessoas que estão na lista dessa pelada.",
        );
      }
    }

    const id = randomUUID();
    await conn.execute(
      `INSERT INTO eventos_gol (id, pelada_id, goleador_id, assistente_id, registrado_por)
       VALUES (?, ?, ?, ?, ?)`,
      [id, peladaId, goleadorId ?? null, assistenteId ?? null, registradoPorId],
    );

    if (goleadorId) {
      await conn.execute("UPDATE pessoas SET gols = gols + 1 WHERE id = ?", [
        goleadorId,
      ]);
    }
    if (assistenteId) {
      await conn.execute(
        "UPDATE pessoas SET assistencias = assistencias + 1 WHERE id = ?",
        [assistenteId],
      );
    }

    await conn.commit();

    const [novoRows] = await pool.execute(
      `SELECT e.id, e.pelada_id,
              e.goleador_id, g.apelido AS goleador_apelido,
              e.assistente_id, a.apelido AS assistente_apelido,
              e.criado_em
       FROM eventos_gol e
       LEFT JOIN pessoas g ON g.id = e.goleador_id
       LEFT JOIN pessoas a ON a.id = e.assistente_id
       WHERE e.id = ?`,
      [id],
    );
    return paraEventoGol((novoRows as LinhaEventoGol[])[0]);
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}

/** Remove um gol lançado por engano e desfaz o incremento nos contadores. */
export async function removerEventoGol(eventoId: string): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      "SELECT * FROM eventos_gol WHERE id = ? LIMIT 1 FOR UPDATE",
      [eventoId],
    );
    const evento = (
      rows as { goleador_id: string | null; assistente_id: string | null }[]
    )[0];
    if (!evento) throw new Error("Gol não encontrado.");

    await conn.execute("DELETE FROM eventos_gol WHERE id = ?", [eventoId]);

    // GREATEST(x-1, 0) evita erro de underflow, já que gols/assistencias
    // são colunas UNSIGNED (nunca podem ficar negativas).
    if (evento.goleador_id) {
      await conn.execute(
        "UPDATE pessoas SET gols = GREATEST(gols - 1, 0) WHERE id = ?",
        [evento.goleador_id],
      );
    }
    if (evento.assistente_id) {
      await conn.execute(
        "UPDATE pessoas SET assistencias = GREATEST(assistencias - 1, 0) WHERE id = ?",
        [evento.assistente_id],
      );
    }

    await conn.commit();
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}
