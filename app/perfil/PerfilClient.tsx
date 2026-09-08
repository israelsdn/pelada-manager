"use client";

import { FormEvent, useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import { compactarFoto } from "@/lib/foto";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar o perfil.");
    return res.json();
  });

interface Perfil {
  id: string;
  nomeCompleto: string;
  apelido: string;
  foto: string | null;
}

export default function PerfilClient() {
  const { update } = useSession();
  const { data, isLoading, error, mutate } = useSWR<{ pessoa: Perfil }>(
    "/api/perfil",
    fetcher,
  );
  const pessoa = data?.pessoa;

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [apelido, setApelido] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [iniciado, setIniciado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "erro" | "sucesso";
    texto: string;
  } | null>(null);

  useEffect(() => {
    if (!pessoa || iniciado) return;
    setNomeCompleto(pessoa.nomeCompleto);
    setApelido(pessoa.apelido);
    setFoto(pessoa.foto);
    setIniciado(true);
  }, [pessoa, iniciado]);

  async function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    setProcessandoFoto(true);
    setMensagem(null);
    try {
      const compactada = await compactarFoto(arquivo);
      setFoto(compactada);
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto:
          erro instanceof Error
            ? erro.message
            : "Não foi possível processar a foto.",
      });
    } finally {
      setProcessandoFoto(false);
    }
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!nomeCompleto.trim() || !apelido.trim()) {
      setMensagem({
        tipo: "erro",
        texto: "Preencha nome completo e apelido.",
      });
      return;
    }

    setSalvando(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeCompleto: nomeCompleto.trim(),
          apelido: apelido.trim(),
          foto,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      await update({
        nomeCompleto: json.pessoa.nomeCompleto,
        apelido: json.pessoa.apelido,
      });
      mutate({ pessoa: json.pessoa }, false);
      setMensagem({ tipo: "sucesso", texto: "Perfil atualizado!" });
    } catch {
      setMensagem({
        tipo: "erro",
        texto: "Falha de conexão ao salvar o perfil.",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <h1 className="font-display text-3xl tracking-wide text-chalk">
            PERFIL
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

      {isLoading && (
        <p className="text-center text-chalk-muted">Carregando...</p>
      )}
      {error && (
        <p className="text-center text-card-red">
          Não foi possível carregar o perfil.
        </p>
      )}

      {iniciado && (
        <form
          onSubmit={salvar}
          className="space-y-5 rounded-lg border border-pitch-line bg-pitch-surface p-6"
        >
          <div className="flex flex-col items-center gap-3">
            <Avatar
              src={foto}
              apelido={apelido || pessoa?.apelido}
              className="h-24 w-24 text-3xl"
            />
            <label className="cursor-pointer rounded-md border border-card-yellow/40 px-3 py-1.5 text-xs text-card-yellow hover:bg-card-yellow/10">
              {processandoFoto ? "Processando..." : "Escolher foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={processandoFoto}
                onChange={(e) => escolherFoto(e.target.files?.[0])}
              />
            </label>
            {foto && (
              <button
                type="button"
                onClick={() => setFoto(null)}
                className="text-xs text-card-red hover:underline"
              >
                Remover foto
              </button>
            )}
            <p className="text-center text-xs text-chalk-muted">
              A imagem é reduzida no aparelho antes de salvar, para não pesar
              no banco.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-chalk-muted">
              Nome completo
            </label>
            <input
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className="w-full rounded-md border border-pitch-line bg-pitch-raised px-3 py-2 text-sm text-chalk focus:border-grass focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-chalk-muted">
              Apelido
            </label>
            <input
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              className="w-full rounded-md border border-pitch-line bg-pitch-raised px-3 py-2 text-sm text-chalk focus:border-grass focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={salvando || processandoFoto}
            className="w-full rounded-md bg-grass py-3 font-display text-lg tracking-wide text-pitch hover:bg-grass-dim disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar perfil"}
          </button>
        </form>
      )}
    </main>
  );
}
