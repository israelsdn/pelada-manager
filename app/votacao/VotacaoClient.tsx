"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Pelada, Voto } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar.");
    return res.json();
  });

const NOTAS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface JogadorVotacao {
  id: string;
  apelido: string;
  rotulo: string;
}

function jogadoresUnicos(itens: JogadorVotacao[]): JogadorVotacao[] {
  const vistos = new Set<string>();
  return itens.filter((item) => {
    if (vistos.has(item.id)) return false;
    vistos.add(item.id);
    return true;
  });
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VotacaoClient({
  administrador,
  usuarioId,
}: {
  administrador: boolean;
  usuarioId: string;
}) {
  const { data: listaData, isLoading: carregandoLista } = useSWR<{
    pelada: Pelada | null;
  }>("/api/lista", fetcher);
  const pelada = listaData?.pelada ?? null;

  const { data: votosData, mutate: mutateVotos } = useSWR<{ votos: Voto[] }>(
    pelada ? `/api/votacao?peladaId=${pelada.id}` : null,
    fetcher,
  );

  const [notas, setNotas] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "erro" | "sucesso";
    texto: string;
  } | null>(null);

  useEffect(() => {
    setNotas({});
  }, [pelada?.id]);

  useEffect(() => {
    if (!votosData?.votos) return;
    setNotas((atual) => {
      const proximo = { ...atual };
      for (const voto of votosData.votos) {
        if (proximo[voto.votadoId] === undefined) {
          proximo[voto.votadoId] = voto.nota;
        }
      }
      return proximo;
    });
  }, [votosData]);

  const agora = Date.now();
  const janela = useMemo(() => {
    if (!pelada) return { aberta: false, texto: null as string | null };
    const inicio = new Date(pelada.diaEvento).getTime();
    const fim = new Date(pelada.dataFim).getTime();
    if (agora < inicio) {
      return {
        aberta: false,
        texto: `A votação abre em ${formatarDataHora(pelada.diaEvento)}.`,
      };
    }
    if (agora > fim) {
      return {
        aberta: false,
        texto: `A votação encerrou em ${formatarDataHora(pelada.dataFim)}.`,
      };
    }
    return {
      aberta: true,
      texto: `Aberta até ${formatarDataHora(pelada.dataFim)}.`,
    };
  }, [pelada, agora]);

  const jogadores: JogadorVotacao[] = pelada
    ? jogadoresUnicos([
        ...pelada.listaGoleiros.map((i) => ({
          id: i.pessoaId,
          apelido: i.apelido,
          rotulo: `${i.apelido} · goleiro`,
        })),
        ...pelada.listaJogadores.map((i) => ({
          id: i.pessoaId,
          apelido: i.apelido,
          rotulo: i.apelido,
        })),
        ...pelada.listaSuplentes.map((i) => ({
          id: i.pessoaId,
          apelido: i.apelido,
          rotulo: `${i.apelido} (suplente)`,
        })),
      ]).sort((a, b) => a.apelido.localeCompare(b.apelido))
    : [];

  const participou = jogadores.some((jogador) => jogador.id === usuarioId);

  async function salvar() {
    if (!pelada || !janela.aberta || !participou) return;

    const votos = Object.entries(notas).map(([votadoId, nota]) => ({
      votadoId,
      nota,
    }));
    if (!votos.length) {
      setMensagem({
        tipo: "erro",
        texto: "Escolha pelo menos uma nota de 0 a 10.",
      });
      return;
    }

    setEnviando(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/votacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peladaId: pelada.id, votos }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      setMensagem({ tipo: "sucesso", texto: "Votos salvos!" });
      mutateVotos({ votos: json.votos }, false);
    } catch {
      setMensagem({
        tipo: "erro",
        texto: "Falha de conexão ao salvar os votos.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <h1 className="font-display text-3xl tracking-wide text-chalk">
            VOTAÇÃO
          </h1>
        </div>
        <div className="flex gap-2">
          {administrador && (
            <Link
              href="/notas"
              className="rounded-md border border-card-yellow/40 px-3 py-2 text-sm text-card-yellow hover:bg-card-yellow/10"
            >
              Notas
            </Link>
          )}
          <Link
            href="/dashboard"
            className="rounded-md border border-pitch-line px-3 py-2 text-sm text-chalk-muted hover:text-chalk"
          >
            Voltar
          </Link>
        </div>
      </header>

      {mensagem && (
        <div
          className={`mb-6 rounded-md border px-4 py-3 text-sm ${
            mensagem.tipo === "erro"
              ? "border-card-red/40 bg-card-red/10 text-card-red"
              : "border-grass/40 bg-grass/10 text-grass"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {carregandoLista && (
        <p className="text-center text-chalk-muted">Carregando...</p>
      )}

      {!carregandoLista && !pelada && (
        <p className="text-center text-chalk-muted">
          Nenhuma pelada em aberto no momento. A votação fica disponível entre
          o início do jogo e o horário de término.
        </p>
      )}

      {pelada && (
        <>
          <p
            className={`mb-6 text-center text-sm ${
              janela.aberta ? "text-grass" : "text-chalk-muted"
            }`}
          >
            {janela.texto}
          </p>

          {jogadores.length === 0 ? (
            <p className="text-center text-sm text-chalk-muted">
              Ainda não há ninguém na lista desta pelada.
            </p>
          ) : !participou ? (
            <p className="text-center text-sm text-chalk-muted">
              Só quem estava na lista dessa pelada pode votar.
            </p>
          ) : (
            <section className="space-y-3">
              {jogadores.map((jogador) => (
                <div
                  key={jogador.id}
                  className="rounded-lg border border-pitch-line bg-pitch-surface p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium text-chalk">{jogador.rotulo}</p>
                    <span className="font-mono text-sm text-card-yellow">
                      {notas[jogador.id] === undefined
                        ? "—"
                        : notas[jogador.id]}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
                    {NOTAS.map((nota) => {
                      const selecionada = notas[jogador.id] === nota;
                      return (
                        <button
                          key={nota}
                          type="button"
                          disabled={!janela.aberta}
                          onClick={() =>
                            setNotas((atual) => ({
                              ...atual,
                              [jogador.id]: nota,
                            }))
                          }
                          className={`rounded-md py-1.5 font-mono text-xs ${
                            selecionada
                              ? "bg-grass text-pitch"
                              : "border border-pitch-line bg-pitch-raised text-chalk-muted hover:text-chalk"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {nota}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                onClick={salvar}
                disabled={enviando || !janela.aberta}
                className="w-full rounded-md bg-grass py-3 font-display text-lg tracking-wide text-pitch hover:bg-grass-dim disabled:opacity-60"
              >
                {enviando ? "Salvando..." : "Salvar votos"}
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}
