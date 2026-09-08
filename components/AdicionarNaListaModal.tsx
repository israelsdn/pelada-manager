"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Pessoa, Posicao } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar usuários.");
    return res.json();
  });

interface AdicionarNaListaModalProps {
  posicao: Posicao;
  idsNaLista: string[];
  enviando: boolean;
  onFechar: () => void;
  onEscolher: (pessoaId: string) => void;
}

export default function AdicionarNaListaModal({
  posicao,
  idsNaLista,
  enviando,
  onFechar,
  onEscolher,
}: AdicionarNaListaModalProps) {
  const { data, error, isLoading } = useSWR<{ pessoas: Pessoa[] }>(
    "/api/usuarios",
    fetcher,
  );
  const [busca, setBusca] = useState("");

  const disponiveis = useMemo(() => {
    const inscritos = new Set(idsNaLista);
    const termo = busca.trim().toLowerCase();
    return (data?.pessoas ?? [])
      .filter((p) => !inscritos.has(p.id))
      .filter((p) =>
        termo
          ? p.apelido.toLowerCase().includes(termo) ||
            p.nomeCompleto.toLowerCase().includes(termo)
          : true,
      )
      .sort((a, b) => a.apelido.localeCompare(b.apelido));
  }, [data?.pessoas, idsNaLista, busca]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-lg border border-pitch-line bg-pitch-surface">
        <div className="flex items-center justify-between border-b border-pitch-line px-4 py-3">
          <p className="font-display text-xl tracking-wide text-chalk">
            Adicionar {posicao === "goleiro" ? "goleiro" : "jogador"}
          </p>
          <button
            type="button"
            onClick={onFechar}
            className="text-sm text-chalk-muted hover:text-chalk"
          >
            Fechar
          </button>
        </div>

        <div className="border-b border-pitch-line p-4">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por apelido..."
            className="w-full rounded-md border border-pitch-line bg-pitch-raised px-3 py-2 text-sm text-chalk focus:border-grass focus:outline-none"
          />
        </div>

        <div className="overflow-y-auto p-2">
          {isLoading && (
            <p className="px-3 py-6 text-center text-sm text-chalk-muted">
              Carregando jogadores...
            </p>
          )}
          {error && (
            <p className="px-3 py-6 text-center text-sm text-card-red">
              Não foi possível carregar os cadastros.
            </p>
          )}
          {!isLoading && !error && disponiveis.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-chalk-muted">
              Ninguém disponível para essa vaga.
            </p>
          )}
          {disponiveis.map((pessoa) => (
            <button
              key={pessoa.id}
              type="button"
              disabled={enviando}
              onClick={() => onEscolher(pessoa.id)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left hover:bg-pitch-raised disabled:opacity-60"
            >
              <span className="truncate text-sm text-chalk">
                {pessoa.apelido}
              </span>
              {!pessoa.ativo && (
                <span className="ml-2 text-xs text-chalk-muted">inativo</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
