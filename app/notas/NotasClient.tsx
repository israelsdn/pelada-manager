"use client";

import useSWR from "swr";
import Link from "next/link";
import Logo from "@/components/Logo";
import { NotaMensal } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar.");
    return res.json();
  });

const MEDALHAS = ["🥇", "🥈", "🥉"];

function corMedia(media: number) {
  if (media >= 8) return "text-grass";
  if (media >= 5) return "text-card-yellow";
  return "text-card-red";
}

export default function NotasClient() {
  const { data, error, isLoading } = useSWR<{
    mes: string;
    notas: NotaMensal[];
  }>("/api/votacao/notas", fetcher);

  const notas = data?.notas ?? [];
  const mes = data?.mes ?? "";

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <h1 className="font-display text-3xl tracking-wide text-chalk">
            NOTAS
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/votacao"
            className="rounded-md border border-card-yellow/40 px-3 py-2 text-sm text-card-yellow hover:bg-card-yellow/10"
          >
            Votar
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-pitch-line px-3 py-2 text-sm text-chalk-muted hover:text-chalk"
          >
            Voltar
          </Link>
        </div>
      </header>

      {mes && (
        <p className="mb-6 text-center text-sm text-chalk-muted">
          Média do mês · {mes}
        </p>
      )}

      {isLoading && (
        <p className="text-center text-chalk-muted">Carregando...</p>
      )}

      {error && (
        <p className="text-center text-card-red">
          Não foi possível carregar as notas do mês.
        </p>
      )}

      {!isLoading && !error && notas.length === 0 && (
        <p className="text-center text-chalk-muted">
          Ainda não há votos registrados neste mês.
        </p>
      )}

      {notas.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-pitch-line bg-pitch-surface">
          <div className="grid grid-cols-[56px_1fr_72px_72px] items-center border-b border-pitch-line px-4 py-3 text-xs uppercase tracking-widest text-chalk-muted">
            <span className="text-center">#</span>
            <span>Jogador</span>
            <span className="text-center">Média</span>
            <span className="text-center">Votos</span>
          </div>

          {notas.map((jogador, i) => (
            <div
              key={jogador.pessoaId}
              className={`grid grid-cols-[56px_1fr_72px_72px] items-center px-4 py-4 ${
                i !== notas.length - 1 ? "border-b border-pitch-line" : ""
              }`}
            >
              <span className="flex justify-center font-mono text-sm text-chalk-muted">
                {MEDALHAS[i] ?? i + 1}
              </span>
              <span className="truncate font-medium text-chalk">
                {jogador.apelido}
              </span>
              <span
                className={`text-center font-mono font-bold ${corMedia(jogador.media)}`}
              >
                {jogador.media.toFixed(1)}
              </span>
              <span className="text-center font-mono text-chalk-muted">
                {jogador.totalVotos}
              </span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
