"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import { EdicaoSuperclassico, Pessoa } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar.");
    return res.json();
  });

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

export default function SuperclassicoClient({
  administrador,
}: {
  administrador: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR<{
    edicoes: EdicaoSuperclassico[];
  }>("/api/superclassico", fetcher);

  const { data: usuariosData } = useSWR<{ pessoas: Pessoa[] }>(
    administrador ? "/api/usuarios" : null,
    fetcher,
  );

  const [formAberto, setFormAberto] = useState(false);
  const [dataConquista, setDataConquista] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{
    tipo: "erro" | "sucesso";
    texto: string;
  } | null>(null);

  const edicoes = data?.edicoes ?? [];
  const pessoas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (usuariosData?.pessoas ?? [])
      .filter((p) =>
        termo
          ? p.apelido.toLowerCase().includes(termo) ||
            p.nomeCompleto.toLowerCase().includes(termo)
          : true,
      )
      .sort((a, b) => a.apelido.localeCompare(b.apelido));
  }, [usuariosData?.pessoas, busca]);

  function alternarPessoa(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  async function salvar() {
    if (!dataConquista) {
      setMensagem({ tipo: "erro", texto: "Informe a data da conquista." });
      return;
    }
    if (!selecionados.length) {
      setMensagem({ tipo: "erro", texto: "Selecione quem ganhou." });
      return;
    }

    setEnviando(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/superclassico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: dataConquista,
          pessoaIds: selecionados,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      setFormAberto(false);
      setDataConquista("");
      setSelecionados([]);
      setBusca("");
      setMensagem({ tipo: "sucesso", texto: "Vencedores registrados!" });
      mutate();
    } catch {
      setMensagem({
        tipo: "erro",
        texto: "Falha de conexão ao salvar os vencedores.",
      });
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id: string) {
    if (!confirm("Remover essa edição do Superclássico?")) return;
    setRemovendoId(id);
    setMensagem(null);
    try {
      const res = await fetch(`/api/superclassico/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      mutate();
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha de conexão ao remover." });
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
            SUPERCLÁSSICO
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

      {administrador && (
        <div className="mb-8">
          {!formAberto ? (
            <button
              type="button"
              onClick={() => setFormAberto(true)}
              className="w-full rounded-md border border-card-yellow/40 px-4 py-3 text-sm text-card-yellow hover:bg-card-yellow/10"
            >
              Adicionar vencedores
            </button>
          ) : (
            <section className="space-y-4 rounded-lg border border-card-yellow/40 bg-pitch-surface p-5">
              <p className="font-display text-xl tracking-wide text-chalk">
                Nova conquista
              </p>
              <div>
                <label className="mb-1 block text-xs text-chalk-muted">
                  Data
                </label>
                <input
                  type="date"
                  value={dataConquista}
                  onChange={(e) => setDataConquista(e.target.value)}
                  className="w-full rounded-md border border-pitch-line bg-pitch-raised px-3 py-2 text-sm text-chalk focus:border-grass focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-chalk-muted">
                  Quem ganhou ({selecionados.length})
                </label>
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar jogador..."
                  className="mb-2 w-full rounded-md border border-pitch-line bg-pitch-raised px-3 py-2 text-sm text-chalk focus:border-grass focus:outline-none"
                />
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {pessoas.map((pessoa) => {
                    const marcado = selecionados.includes(pessoa.id);
                    return (
                      <button
                        key={pessoa.id}
                        type="button"
                        onClick={() => alternarPessoa(pessoa.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left ${
                          marcado
                            ? "bg-grass/15 text-grass"
                            : "hover:bg-pitch-raised"
                        }`}
                      >
                        <Avatar
                          src={pessoa.foto}
                          apelido={pessoa.apelido}
                          className="h-7 w-7 text-xs"
                        />
                        <span className="truncate text-sm text-chalk">
                          {pessoa.apelido}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={salvar}
                  disabled={enviando}
                  className="flex-1 rounded-md bg-grass py-3 font-display text-lg tracking-wide text-pitch hover:bg-grass-dim disabled:opacity-60"
                >
                  {enviando ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormAberto(false)}
                  className="rounded-md border border-pitch-line px-4 py-3 text-sm text-chalk-muted hover:text-chalk"
                >
                  Cancelar
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {isLoading && (
        <p className="text-center text-chalk-muted">Carregando...</p>
      )}
      {error && (
        <p className="text-center text-card-red">
          Não foi possível carregar o Superclássico.
        </p>
      )}
      {!isLoading && !error && edicoes.length === 0 && (
        <p className="text-center text-chalk-muted">
          Ainda não tem vencedor registrado.
        </p>
      )}

      <div className="space-y-4">
        {edicoes.map((edicao) => (
          <section
            key={edicao.id}
            className="rounded-lg border border-pitch-line bg-pitch-surface p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-display text-xl tracking-wide text-card-yellow">
                {formatarData(edicao.data)}
              </p>
              {administrador && (
                <button
                  type="button"
                  onClick={() => remover(edicao.id)}
                  disabled={removendoId === edicao.id}
                  className="text-xs text-card-red hover:underline disabled:opacity-60"
                >
                  {removendoId === edicao.id ? "Removendo..." : "Remover"}
                </button>
              )}
            </div>
            <ul className="space-y-2">
              {edicao.vencedores.map((vencedor) => (
                <li
                  key={vencedor.pessoaId}
                  className="flex items-center gap-2 text-sm text-chalk"
                >
                  <Avatar
                    src={vencedor.foto}
                    apelido={vencedor.apelido}
                    className="h-8 w-8 text-xs"
                  />
                  <span>{vencedor.apelido}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
