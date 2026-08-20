"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Regras } from "@/types";

export default function RegrasPage() {
  const { data: session, status } = useSession();
  const [regras, setRegras] = useState<Regras | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(
    null
  );

  const ehAdmin = !!session?.user?.administrador;

  useEffect(() => {
    carregarRegras();
  }, []);

  async function carregarRegras() {
    setCarregando(true);
    try {
      const res = await fetch("/api/regras");
      const json = await res.json();
      setRegras(json.regras);
      setTexto(json.regras?.conteudo ?? "");
    } catch {
      setMensagem({ tipo: "erro", texto: "Não foi possível carregar as regras." });
    } finally {
      setCarregando(false);
    }
  }

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/regras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: texto }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.message });
        return;
      }
      setRegras(json.regras);
      setEditando(false);
      setMensagem({ tipo: "sucesso", texto: "Regras atualizadas!" });
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha de conexão ao salvar." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <h1 className="font-display text-3xl tracking-wide text-chalk">REGRAS</h1>
        </div>
        <Link
          href={status === "authenticated" ? "/dashboard" : "/login"}
          className="rounded-md border border-pitch-line px-3 py-2 text-sm text-chalk-muted hover:text-chalk"
        >
          {status === "authenticated" ? "Voltar" : "Entrar"}
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

      {carregando ? (
        <p className="text-center text-chalk-muted">Carregando...</p>
      ) : (
        <section className="rounded-lg border border-pitch-line bg-pitch-surface p-6">
          {editando ? (
            <div className="space-y-4">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={16}
                className="w-full rounded-md border border-pitch-line bg-pitch-raised px-4 py-3 font-mono text-sm text-chalk focus:border-grass focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditando(false);
                    setTexto(regras?.conteudo ?? "");
                  }}
                  disabled={salvando}
                  className="flex-1 rounded-md border border-pitch-line py-2 text-sm text-chalk-muted hover:text-chalk disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="flex-1 rounded-md bg-grass py-2 font-display text-base tracking-wide text-pitch hover:bg-grass-dim disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-chalk">
                {regras?.conteudo}
              </p>
              <p className="mt-6 text-xs text-chalk-muted">
                Última atualização em{" "}
                {regras?.atualizadoEm &&
                  new Date(regras.atualizadoEm).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                {regras?.atualizadoPorApelido && ` por ${regras.atualizadoPorApelido}`}
              </p>
              {ehAdmin && (
                <button
                  onClick={() => setEditando(true)}
                  className="mt-4 rounded-md border border-card-yellow px-4 py-2 text-sm text-card-yellow hover:bg-card-yellow/10"
                >
                  Editar regras
                </button>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
