"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Countdown from "@/components/Countdown";
import JerseySlot from "@/components/JerseySlot";
import Logo from "@/components/Logo";
import AbrirListaForm from "@/components/AbrirListaForm";
import { LIMITE_GOLEIROS, LIMITE_JOGADORES, Pelada, Posicao, SessaoUsuario } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar a lista.");
    return res.json();
  });

interface DashboardClientProps {
  usuario: SessaoUsuario;
}

interface VersaoPelada {
  id: string;
  atualizadoEm: string;
}

export default function DashboardClient({ usuario }: DashboardClientProps) {
  const { data, error, isLoading, mutate } = useSWR<{
    pelada: Pelada | null;
  }>("/api/lista", fetcher, {
    // Esse hook só busca os dados completos quando o polling leve (abaixo)
    // detecta uma mudança real - por isso não precisa de refreshInterval
    // aqui. Mantemos revalidação ao focar a aba/reconectar como reforço.
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    compare: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });

  // Polling leve: consulta só id + atualizado_em da pelada aberta (query
  // muito barata, sem JOIN). Só quando esse valor muda de verdade é que
  // disparamos a busca completa acima - assim o banco não é sobrecarregado
  // mesmo com várias pessoas com o dashboard aberto ao mesmo tempo.
  const { data: versaoData } = useSWR<{ versao: VersaoPelada | null }>(
    "/api/lista/versao",
    fetcher,
    { refreshInterval: 8000, revalidateOnFocus: true }
  );

  const ultimaVersaoVista = useRef<string | null>(null);
  useEffect(() => {
    if (!versaoData) return;
    const chave = versaoData.versao
      ? `${versaoData.versao.id}:${versaoData.versao.atualizadoEm}`
      : "nenhuma";
    if (ultimaVersaoVista.current !== null && ultimaVersaoVista.current !== chave) {
      mutate();
    }
    ultimaVersaoVista.current = chave;
  }, [versaoData, mutate]);

  // Relógio local independente do SWR, só para reavaliar a fase da lista
  // (antes de abrir / aberta / encerrada) mesmo quando os dados não mudam.
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 30000);
    return () => clearInterval(intervalo);
  }, []);

  const [inscrevendo, setInscrevendo] = useState<Posicao | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(
    null
  );

  const pelada = data?.pelada ?? null;
  const antesDoInicio = pelada ? new Date(pelada.dataInicio).getTime() > agora : false;
  const inscricoesAbertas = pelada
    ? new Date(pelada.dataInicio).getTime() <= agora &&
      new Date(pelada.dataTermino).getTime() > agora
    : false;

  const jaInscrito = pelada
    ? [...pelada.listaGoleiros, ...pelada.listaJogadores, ...pelada.listaSuplentes].some(
        (item) => item.pessoaId === usuario.id
      )
    : false;

  async function abrirLista(datas: {
    dataInicio: string;
    diaEvento: string;
    dataTermino: string;
  }) {
    setAbrindo(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/lista/abrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datas),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      setMensagem({ tipo: "sucesso", texto: "Lista aberta! Bora chamar a galera." });
      mutate();
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha de conexão ao abrir a lista." });
    } finally {
      setAbrindo(false);
    }
  }

  async function inscrever(posicao: Posicao) {
    if (!pelada) return;
    setInscrevendo(posicao);
    setMensagem(null);
    try {
      const res = await fetch("/api/lista/inscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peladaId: pelada.id, posicao }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      setMensagem({ tipo: "sucesso", texto: json.message });
      mutate();
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha de conexão ao se inscrever." });
    } finally {
      setInscrevendo(null);
    }
  }

  async function sairDaLista() {
    if (!pelada) return;
    setSaindo(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/lista/sair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peladaId: pelada.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      setMensagem({ tipo: "sucesso", texto: json.message });
      mutate();
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha de conexão ao sair da lista." });
    } finally {
      setSaindo(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-16 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div>
            <p className="text-xs uppercase tracking-widest text-chalk-muted">E aí,</p>
            <h1 className="font-display text-3xl tracking-wide text-chalk">
              {usuario.apelido}
            </h1>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md border border-pitch-line px-3 py-2 text-sm text-chalk-muted hover:border-card-red/40 hover:text-card-red"
        >
          Sair
        </button>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/regras"
          className="rounded-md border border-pitch-line px-3 py-1.5 text-xs text-chalk-muted hover:text-chalk"
        >
          Regras
        </Link>
        <Link
          href="/ranking"
          className="rounded-md border border-pitch-line px-3 py-1.5 text-xs text-chalk-muted hover:text-chalk"
        >
          Ranking
        </Link>
        {usuario.administrador && (
          <Link
            href="/usuarios"
            className="rounded-md border border-card-yellow/40 px-3 py-1.5 text-xs text-card-yellow hover:bg-card-yellow/10"
          >
            Usuários
          </Link>
        )}
      </nav>

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

      {isLoading && (
        <p className="text-center text-chalk-muted">Carregando a lista...</p>
      )}

      {error && !pelada && (
        <p className="text-center text-card-red">
          Não foi possível carregar a lista agora.
        </p>
      )}

      {!isLoading && !pelada && (
        <div className="rounded-lg border border-dashed border-pitch-line bg-pitch-surface p-8 text-center">
          <p className="font-display text-2xl text-chalk">Nenhuma lista em aberto</p>
          <p className="mt-2 text-sm text-chalk-muted">
            {usuario.administrador
              ? "Abra a lista para começar a chamar a galera para a próxima segunda."
              : "Assim que a administração abrir a lista, ela aparece aqui."}
          </p>
          {usuario.administrador && (
            <AbrirListaForm onConfirmar={abrirLista} carregando={abrindo} />
          )}
        </div>
      )}

      {pelada && (
        <div className="space-y-8">
          <section className="rounded-lg border border-pitch-line bg-pitch-surface p-6">
            {antesDoInicio ? (
              <Countdown targetIso={pelada.dataInicio} label="Inscrições abrem em" />
            ) : (
              <Countdown targetIso={pelada.dataTermino} label="Fecha a lista em" />
            )}
            <p className="mt-4 text-center text-xs text-chalk-muted">
              Bola rolando segunda, {formatarDataHora(pelada.diaEvento)}
            </p>
          </section>

          {antesDoInicio && (
            <p className="text-center text-sm text-chalk-muted">
              As inscrições ainda não abriram — começam em{" "}
              {formatarDataHora(pelada.dataInicio)}.
            </p>
          )}

          {inscricoesAbertas && !jaInscrito && (
            <section className="rounded-lg border border-pitch-line bg-pitch-surface p-6 text-center">
              <p className="mb-4 font-display text-xl tracking-wide text-chalk">
                Confirmar presença
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => inscrever("goleiro")}
                  disabled={inscrevendo !== null}
                  className="rounded-md border border-grass px-5 py-3 font-display text-lg tracking-wide text-grass hover:bg-grass/10 disabled:opacity-60"
                >
                  {inscrevendo === "goleiro" ? "Entrando..." : "Sou goleiro"}
                </button>
                <button
                  onClick={() => inscrever("jogador")}
                  disabled={inscrevendo !== null}
                  className="rounded-md border border-card-yellow px-5 py-3 font-display text-lg tracking-wide text-card-yellow hover:bg-card-yellow/10 disabled:opacity-60"
                >
                  {inscrevendo === "jogador" ? "Entrando..." : "Sou jogador"}
                </button>
              </div>
            </section>
          )}

          {jaInscrito && (
            <div className="text-center">
              <p className="text-sm text-grass">
                Você já está na lista dessa semana. Boa pelada! ⚽
              </p>
              <button
                onClick={sairDaLista}
                disabled={saindo}
                className="mt-3 rounded-md border border-card-red/40 px-4 py-2 text-sm text-card-red hover:bg-card-red/10 disabled:opacity-60"
              >
                {saindo ? "Saindo..." : "Retirar minha presença"}
              </button>
            </div>
          )}

          <section className="rounded-lg border border-pitch-line bg-pitch-surface p-6">
            <p className="mb-4 font-display text-lg tracking-wide text-chalk-muted">
              GOLEIROS ({pelada.listaGoleiros.length}/{LIMITE_GOLEIROS})
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {Array.from({ length: LIMITE_GOLEIROS }).map((_, i) => {
                const item = pelada.listaGoleiros[i];
                return (
                  <JerseySlot
                    key={i}
                    numero={i + 1}
                    apelido={item?.apelido}
                    destaque={item?.pessoaId === usuario.id}
                  />
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-pitch-line bg-pitch-surface p-6">
            <p className="mb-4 font-display text-lg tracking-wide text-chalk-muted">
              JOGADORES ({pelada.listaJogadores.length}/{LIMITE_JOGADORES})
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {Array.from({ length: LIMITE_JOGADORES }).map((_, i) => {
                const item = pelada.listaJogadores[i];
                return (
                  <JerseySlot
                    key={i}
                    numero={i + 1}
                    apelido={item?.apelido}
                    destaque={item?.pessoaId === usuario.id}
                  />
                );
              })}
            </div>
          </section>

          {pelada.listaSuplentes.length > 0 && (
            <section className="rounded-lg border border-card-red/30 bg-card-red/5 p-6">
              <p className="mb-4 font-display text-lg tracking-wide text-card-red">
                SUPLENTES ({pelada.listaSuplentes.length})
              </p>
              <ul className="space-y-2">
                {pelada.listaSuplentes.map((item, i) => (
                  <li
                    key={item.id ?? i}
                    className="flex items-center justify-between rounded-md bg-pitch-raised px-4 py-2 text-sm"
                  >
                    <span
                      className={
                        item.pessoaId === usuario.id
                          ? "font-semibold text-card-yellow"
                          : "text-chalk"
                      }
                    >
                      {item.apelido ?? "Jogador"}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-chalk-muted">
                      {item.posicao === "goleiro" ? "goleiro" : "jogador"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function formatarDataHora(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
