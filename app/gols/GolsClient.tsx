"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Pelada } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar.");
    return res.json();
  });

interface EventoGol {
  id: string;
  goleadorId?: string;
  goleadorApelido?: string;
  assistenteId?: string;
  assistenteApelido?: string;
  criadoEm: string;
}

interface OpcaoPessoa {
  id: string;
  apelido: string;
  rotulo: string;
}

function opcoesUnicas(itens: OpcaoPessoa[]): OpcaoPessoa[] {
  const vistos = new Set<string>();
  return itens.filter((item) => {
    if (vistos.has(item.id)) return false;
    vistos.add(item.id);
    return true;
  });
}

export default function GolsClient() {
  const { data: listaData, isLoading: carregandoLista } = useSWR<{
    pelada: Pelada | null;
  }>("/api/lista", fetcher);
  const pelada = listaData?.pelada ?? null;

  const { data: golsData, mutate: mutateGols } = useSWR<{ gols: EventoGol[] }>(
    pelada ? `/api/gols?peladaId=${pelada.id}` : null,
    fetcher,
    { refreshInterval: 15000 },
  );
  const gols = golsData?.gols ?? [];

  const opcoes: OpcaoPessoa[] = pelada
    ? opcoesUnicas([
        ...pelada.listaGoleiros.map((i) => ({
          id: i.pessoaId,
          apelido: i.apelido,
          rotulo: i.apelido,
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

  const [goleadorId, setGoleadorId] = useState("");
  const [assistenteId, setAssistenteId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{
    tipo: "erro" | "sucesso";
    texto: string;
  } | null>(null);

  async function registrar() {
    if (!pelada) return;
    if (!goleadorId && !assistenteId) {
      setMensagem({
        tipo: "erro",
        texto: "Selecione quem fez o gol ou quem deu a assistência.",
      });
      return;
    }

    setEnviando(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/gols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peladaId: pelada.id,
          goleadorId: goleadorId || undefined,
          assistenteId: assistenteId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      setGoleadorId("");
      setAssistenteId("");
      setMensagem({ tipo: "sucesso", texto: "Gol registrado!" });
      mutateGols();
    } catch {
      setMensagem({
        tipo: "erro",
        texto: "Falha de conexão ao registrar o gol.",
      });
    } finally {
      setEnviando(false);
    }
  }

  async function desfazer(id: string) {
    setRemovendoId(id);
    setMensagem(null);
    try {
      const res = await fetch(`/api/gols/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      mutateGols();
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha de conexão ao desfazer." });
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <h1 className="font-display text-3xl tracking-wide text-chalk">
            GOLS
          </h1>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-pitch-line px-3 py-2 text-sm text-chalk-muted hover:text-chalk"
        >
          Voltar
        </Link>
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
          Nenhuma lista em aberto no momento — abra a lista no dashboard antes
          de registrar gols.
        </p>
      )}

      {pelada && (
        <>
          <section className="mb-8 space-y-4 rounded-lg border border-pitch-line bg-pitch-surface p-6">
            <p className="text-center font-display text-xl tracking-wide text-chalk">
              Registrar gol
            </p>
            <p className="text-center text-xs text-chalk-muted">
              Preencha pelo menos um dos dois campos abaixo.
            </p>

            <div>
              <label className="mb-1 block text-xs text-chalk-muted">
                Quem fez o gol
              </label>
              <select
                value={goleadorId}
                onChange={(e) => setGoleadorId(e.target.value)}
                className="w-full rounded-md border border-pitch-line bg-pitch-raised px-3 py-2 text-sm text-chalk focus:border-grass focus:outline-none"
              >
                <option value="">Sem goleador</option>
                {opcoes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-chalk-muted">
                Quem deu a assistência
              </label>
              <select
                value={assistenteId}
                onChange={(e) => setAssistenteId(e.target.value)}
                className="w-full rounded-md border border-pitch-line bg-pitch-raised px-3 py-2 text-sm text-chalk focus:border-grass focus:outline-none"
              >
                <option value="">Sem assistência</option>
                {opcoes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={registrar}
              disabled={enviando}
              className="w-full rounded-md bg-grass py-3 font-display text-lg tracking-wide text-pitch hover:bg-grass-dim disabled:opacity-60"
            >
              {enviando ? "Registrando..." : "⚽ Registrar gol"}
            </button>
          </section>

          <section>
            <p className="mb-3 font-display text-lg tracking-wide text-chalk-muted">
              GOLS DA PARTIDA ({gols.length})
            </p>
            {gols.length === 0 ? (
              <p className="text-center text-sm text-chalk-muted">
                Nenhum gol registrado ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {gols.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between rounded-md border border-pitch-line bg-pitch-surface px-4 py-3 text-sm"
                  >
                    <span className="text-chalk">
                      ⚽{" "}
                      {g.goleadorApelido ?? (
                        <span className="text-chalk-muted">sem goleador</span>
                      )}
                      {g.assistenteApelido && (
                        <span className="text-chalk-muted">
                          {" "}
                          · 🎯 {g.assistenteApelido}
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => desfazer(g.id)}
                      disabled={removendoId === g.id}
                      className="text-xs text-card-red hover:underline disabled:opacity-60"
                    >
                      {removendoId === g.id ? "Removendo..." : "Desfazer"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
