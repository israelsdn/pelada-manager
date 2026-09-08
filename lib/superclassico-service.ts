import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { EdicaoSuperclassico } from "@/types";

function paraDataISO(valor: Date | string): string {
  if (typeof valor === "string") {
    return valor.slice(0, 10);
  }
  return valor.toISOString().slice(0, 10);
}

export async function listarEdicoesSuperclassico(): Promise<
  EdicaoSuperclassico[]
> {
  const [edicaoRows] = await pool.execute(
    `SELECT id, data_conquista
     FROM superclassicos
     ORDER BY data_conquista DESC, criado_em DESC`,
  );
  const edicoes = edicaoRows as { id: string; data_conquista: Date | string }[];
  if (!edicoes.length) return [];

  const ids = edicoes.map((e) => e.id);
  const [vencedorRows] = await pool.query(
    `SELECT v.superclassico_id, p.id AS pessoa_id, p.apelido, p.foto
     FROM superclassico_vencedores v
     JOIN pessoas p ON p.id = v.pessoa_id
     WHERE v.superclassico_id IN (?)
     ORDER BY p.apelido ASC`,
    [ids],
  );

  const porEdicao = new Map<string, EdicaoSuperclassico["vencedores"]>();
  for (const row of vencedorRows as {
    superclassico_id: string;
    pessoa_id: string;
    apelido: string;
    foto: string | null;
  }[]) {
    const lista = porEdicao.get(row.superclassico_id) ?? [];
    lista.push({
      pessoaId: row.pessoa_id,
      apelido: row.apelido,
      foto: row.foto ?? null,
    });
    porEdicao.set(row.superclassico_id, lista);
  }

  return edicoes.map((edicao) => ({
    id: edicao.id,
    data: paraDataISO(edicao.data_conquista),
    vencedores: porEdicao.get(edicao.id) ?? [],
  }));
}

export async function registrarEdicaoSuperclassico(
  criadoPorId: string,
  dataConquista: string,
  pessoaIds: string[],
): Promise<EdicaoSuperclassico> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataConquista)) {
    throw new Error("Informe uma data válida.");
  }

  const ids = [...new Set(pessoaIds.map(String).filter(Boolean))];
  if (!ids.length) {
    throw new Error("Selecione pelo menos um vencedor.");
  }

  const edicaoId = randomUUID();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [pessoasRows] = await conn.query(
      "SELECT id FROM pessoas WHERE id IN (?)",
      [ids],
    );
    const encontrados = new Set(
      (pessoasRows as { id: string }[]).map((p) => p.id),
    );
    if (encontrados.size !== ids.length) {
      throw new Error("Um ou mais jogadores não foram encontrados.");
    }

    await conn.execute(
      "INSERT INTO superclassicos (id, data_conquista, criado_por) VALUES (?, ?, ?)",
      [edicaoId, dataConquista, criadoPorId],
    );

    for (const pessoaId of ids) {
      await conn.execute(
        "INSERT INTO superclassico_vencedores (id, superclassico_id, pessoa_id) VALUES (?, ?, ?)",
        [randomUUID(), edicaoId, pessoaId],
      );
    }

    await conn.commit();
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }

  const edicoes = await listarEdicoesSuperclassico();
  const criada = edicoes.find((e) => e.id === edicaoId);
  if (!criada) throw new Error("Não foi possível carregar a edição salva.");
  return criada;
}

export async function removerEdicaoSuperclassico(edicaoId: string): Promise<void> {
  const [result] = await pool.execute(
    "DELETE FROM superclassicos WHERE id = ?",
    [edicaoId],
  );
  const afetados = (result as { affectedRows?: number }).affectedRows ?? 0;
  if (!afetados) {
    throw new Error("Edição não encontrada.");
  }
}
