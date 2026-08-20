"use client";

import useSWR from "swr";
import Link from "next/link";
import Logo from "@/components/Logo";

interface LinhaRanking {
  id: string;
  apelido: string;
  gols: number;
  assistencias: number;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar o ranking.");
    return res.json();
  });

const MEDALHAS = ["🥇", "🥈", "🥉"];

export default function RankingClient() {
  const { data, error, isLoading } = useSWR<{ ranking: LinhaRanking[] }>(
    "/api/ranking",
    fetcher,
  );

  const ranking = data?.ranking ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <h1 className="font-display text-3xl tracking-wide text-chalk">
            RANKING
          </h1>
        </div>

        <Link
          href="/dashboard"
          className="rounded-md border border-pitch-line px-3 py-2 text-sm text-chalk-muted hover:text-chalk"
        >
          Voltar
        </Link>
      </header>

      {isLoading && (
        <p className="text-center text-chalk-muted">Carregando...</p>
      )}

      {error && (
        <p className="text-center text-card-red">
          Não foi possível carregar o ranking.
        </p>
      )}

      {!isLoading && ranking.length === 0 && (
        <p className="text-center text-chalk-muted">
          Ninguém tem gols ou assistências registrados ainda.
        </p>
      )}

      {ranking.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-pitch-line bg-pitch-surface">
          {/* Cabeçalho */}
          <div className="grid grid-cols-[56px_1fr_72px_90px] items-center border-b border-pitch-line px-4 py-3 text-xs uppercase tracking-widest text-chalk-muted">
            <span className="text-center">#</span>
            <span>Jogador</span>
            <span className="text-center">Gols</span>
            <span className="text-center">Assist.</span>
          </div>

          {/* Linhas */}
          {ranking.map((jogador, i) => (
            <div
              key={jogador.id}
              className={`grid grid-cols-[56px_1fr_72px_90px] items-center px-4 py-4 ${
                i !== ranking.length - 1 ? "border-b border-pitch-line" : ""
              }`}
            >
              {/* Posição */}
              <span className="flex justify-center font-mono text-sm text-chalk-muted">
                {MEDALHAS[i] ?? i + 1}
              </span>

              {/* Jogador */}
              <span className="truncate font-medium text-chalk">
                {jogador.apelido}
              </span>

              {/* Gols */}
              <span className="text-center font-mono font-bold text-grass">
                {jogador.gols}
              </span>

              {/* Assistências */}
              <span className="text-center font-mono font-bold text-card-yellow">
                {jogador.assistencias}
              </span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
