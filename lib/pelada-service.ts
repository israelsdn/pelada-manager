import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { calcularDatasPelada, DatasPelada } from "@/lib/date-utils";
import {
  ItemLista,
  LIMITE_GOLEIROS,
  LIMITE_JOGADORES,
  Pelada,
  Posicao,
  StatusInscricao,
} from "@/types";

interface LinhaPelada {
  id: string;
  data_inicio: Date;
  dia_evento: Date;
  data_termino: Date;
  responsavel_id: string;
  atualizado_em: Date;
}

interface LinhaInscricao {
  id: string;
  pessoa_id: string;
  apelido: string;
  status: StatusInscricao;
  posicao_suplente: Posicao | null;
  device_id: string;
  criado_em: Date;
}

function paraItemLista(row: LinhaInscricao): ItemLista {
  return {
    id: row.id,
    pessoaId: row.pessoa_id,
    apelido: row.apelido,
    posicao: row.posicao_suplente ?? undefined,
  };
}

async function montarPelada(row: LinhaPelada): Promise<Pelada> {
  const [rows] = await pool.execute(
    `SELECT i.*, p.apelido FROM inscricoes i
     JOIN pessoas p ON p.id = i.pessoa_id
     WHERE i.pelada_id = ?
     ORDER BY i.criado_em ASC`,
    [row.id]
  );
  const inscricoes = rows as LinhaInscricao[];

  return {
    id: row.id,
    dataInicio: new Date(row.data_inicio).toISOString(),
    diaEvento: new Date(row.dia_evento).toISOString(),
    dataTermino: new Date(row.data_termino).toISOString(),
    responsavelId: row.responsavel_id,
    atualizadoEm: new Date(row.atualizado_em).toISOString(),
    listaGoleiros: inscricoes.filter((i) => i.status === "goleiro").map(paraItemLista),
    listaJogadores: inscricoes
      .filter((i) => i.status === "jogador")
      .map(paraItemLista),
    listaSuplentes: inscricoes
      .filter((i) => i.status === "suplente")
      .map(paraItemLista),
  };
}

export interface VersaoPelada {
  id: string;
  atualizadoEm: string;
}

/**
 * Checagem leve de "mudou algo?" - só busca id + atualizado_em da pelada
 * aberta, sem fazer o JOIN pesado com inscrições/pessoas. Pensada para ser
 * chamada com frequência (polling) sem pesar no banco; o frontend só busca
 * os dados completos quando esse valor muda.
 */
export async function buscarVersaoPeladaAberta(): Promise<VersaoPelada | null> {
  const [rows] = await pool.execute(
    "SELECT id, atualizado_em FROM peladas WHERE dia_evento > ? ORDER BY dia_evento ASC LIMIT 1",
    [new Date()]
  );
  const linha = (rows as { id: string; atualizado_em: Date }[])[0];
  if (!linha) return null;
  return { id: linha.id, atualizadoEm: new Date(linha.atualizado_em).toISOString() };
}

/** Busca a pelada "em aberto": aquela cujo diaEvento ainda não passou. */
export async function buscarPeladaAberta(): Promise<Pelada | null> {
  // Comparamos com um timestamp calculado aqui no Node (em vez de usar
  // NOW() do MySQL) para eliminar qualquer divergência de fuso horário
  // entre o processo da aplicação e o servidor de banco de dados.
  const [rows] = await pool.execute(
    "SELECT * FROM peladas WHERE dia_evento > ? ORDER BY dia_evento ASC LIMIT 1",
    [new Date()]
  );
  const linhas = rows as LinhaPelada[];
  if (!linhas[0]) return null;
  return montarPelada(linhas[0]);
}

export async function buscarPeladaPorId(id: string): Promise<Pelada | null> {
  const [rows] = await pool.execute("SELECT * FROM peladas WHERE id = ? LIMIT 1", [
    id,
  ]);
  const linhas = rows as LinhaPelada[];
  if (!linhas[0]) return null;
  return montarPelada(linhas[0]);
}

export async function abrirPelada(
  responsavelId: string,
  datasEscolhidas?: Partial<DatasPelada>
): Promise<Pelada> {
  const padrao = calcularDatasPelada();
  const dataInicio = datasEscolhidas?.dataInicio ?? padrao.dataInicio;
  const diaEvento = datasEscolhidas?.diaEvento ?? padrao.diaEvento;
  const dataTermino = datasEscolhidas?.dataTermino ?? padrao.dataTermino;

  const id = randomUUID();
  const agora = new Date();
  await pool.execute(
    `INSERT INTO peladas (id, data_inicio, dia_evento, data_termino, responsavel_id, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      new Date(dataInicio),
      new Date(diaEvento),
      new Date(dataTermino),
      responsavelId,
      agora,
    ]
  );
  return (await buscarPeladaPorId(id))!;
}

export interface ResultadoInscricao {
  destino: "listaGoleiros" | "listaJogadores" | "listaSuplentes";
  posicaoSuplente?: Posicao;
}

export async function inscreverNaPelada(
  peladaId: string,
  pessoaId: string,
  posicaoEscolhida: Posicao,
  deviceId: string
): Promise<{ resultado: ResultadoInscricao; pelada: Pelada }> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // FOR UPDATE trava a linha da pelada até o fim da transação, evitando
    // que duas inscrições concorrentes leiam a mesma contagem de vagas.
    const [peladaRows] = await conn.execute(
      "SELECT * FROM peladas WHERE id = ? FOR UPDATE",
      [peladaId]
    );
    const pelada = (peladaRows as LinhaPelada[])[0];
    if (!pelada) throw new Error("Lista não encontrada.");

    if (new Date(pelada.data_inicio).getTime() > Date.now()) {
      throw new Error("As inscrições para essa lista ainda não abriram.");
    }

    if (new Date(pelada.data_termino).getTime() < Date.now()) {
      throw new Error("As inscrições para essa lista já foram encerradas.");
    }

    const [existentesPessoa] = await conn.execute(
      "SELECT id FROM inscricoes WHERE pelada_id = ? AND pessoa_id = ? LIMIT 1",
      [peladaId, pessoaId]
    );
    if ((existentesPessoa as unknown[]).length) {
      throw new Error("Você já está inscrito nessa lista.");
    }

    const [existentesDevice] = await conn.execute(
      "SELECT id FROM inscricoes WHERE pelada_id = ? AND device_id = ? LIMIT 1",
      [peladaId, deviceId]
    );
    if ((existentesDevice as unknown[]).length) {
      throw new Error(
        "Já existe uma inscrição nessa lista feita a partir desse aparelho."
      );
    }

    const statusPrincipal: StatusInscricao =
      posicaoEscolhida === "goleiro" ? "goleiro" : "jogador";
    const limite = posicaoEscolhida === "goleiro" ? LIMITE_GOLEIROS : LIMITE_JOGADORES;

    const [contagemRows] = await conn.execute(
      "SELECT COUNT(*) as total FROM inscricoes WHERE pelada_id = ? AND status = ?",
      [peladaId, statusPrincipal]
    );
    const total = Number((contagemRows as { total: number }[])[0].total);

    let statusFinal: StatusInscricao = statusPrincipal;
    let posicaoSuplente: Posicao | null = null;

    if (total >= limite) {
      statusFinal = "suplente";
      posicaoSuplente = posicaoEscolhida;
    }

    const id = randomUUID();
    await conn.execute(
      `INSERT INTO inscricoes (id, pelada_id, pessoa_id, status, posicao_suplente, device_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, peladaId, pessoaId, statusFinal, posicaoSuplente, deviceId]
    );

    // Marca a pelada como alterada agora - é isso que o polling leve do
    // frontend detecta para saber que precisa buscar os dados completos.
    await conn.execute("UPDATE peladas SET atualizado_em = ? WHERE id = ?", [
      new Date(),
      peladaId,
    ]);

    await conn.commit();

    const destino: ResultadoInscricao["destino"] =
      statusFinal === "suplente"
        ? "listaSuplentes"
        : statusFinal === "goleiro"
          ? "listaGoleiros"
          : "listaJogadores";

    const peladaAtualizada = await buscarPeladaPorId(peladaId);
    return {
      resultado: { destino, posicaoSuplente: posicaoSuplente ?? undefined },
      pelada: peladaAtualizada!,
    };
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}

export interface ResultadoSaida {
  saiuDe: StatusInscricao;
  promovido?: { pessoaId: string };
}

/**
 * Remove a própria pessoa de qualquer uma das três listas. Se ela saía de
 * uma lista principal (goleiros/jogadores), promove automaticamente o
 * suplente mais antigo da mesma posição.
 */
export async function sairDaPelada(
  peladaId: string,
  pessoaId: string
): Promise<{ resultado: ResultadoSaida; pelada: Pelada }> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [inscricaoRows] = await conn.execute(
      "SELECT * FROM inscricoes WHERE pelada_id = ? AND pessoa_id = ? LIMIT 1 FOR UPDATE",
      [peladaId, pessoaId]
    );
    const inscricao = (inscricaoRows as LinhaInscricao[])[0];
    if (!inscricao) throw new Error("Você não está inscrito nessa lista.");

    await conn.execute("DELETE FROM inscricoes WHERE id = ?", [inscricao.id]);

    let promovidoPessoaId: string | undefined;

    if (inscricao.status === "goleiro" || inscricao.status === "jogador") {
      const [suplentesRows] = await conn.execute(
        `SELECT * FROM inscricoes
         WHERE pelada_id = ? AND status = 'suplente' AND posicao_suplente = ?
         ORDER BY criado_em ASC LIMIT 1 FOR UPDATE`,
        [peladaId, inscricao.status]
      );
      const suplente = (suplentesRows as LinhaInscricao[])[0];

      if (suplente) {
        await conn.execute(
          "UPDATE inscricoes SET status = ?, posicao_suplente = NULL WHERE id = ?",
          [inscricao.status, suplente.id]
        );
        promovidoPessoaId = suplente.pessoa_id;
      }
    }

    // Marca a pelada como alterada agora - é isso que o polling leve do
    // frontend detecta para saber que precisa buscar os dados completos.
    await conn.execute("UPDATE peladas SET atualizado_em = ? WHERE id = ?", [
      new Date(),
      peladaId,
    ]);

    await conn.commit();

    const peladaAtualizada = await buscarPeladaPorId(peladaId);
    return {
      resultado: {
        saiuDe: inscricao.status,
        promovido: promovidoPessoaId ? { pessoaId: promovidoPessoaId } : undefined,
      },
      pelada: peladaAtualizada!,
    };
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}
