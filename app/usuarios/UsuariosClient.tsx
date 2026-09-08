"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import PhoneInput from "@/components/PhoneInput";
import { formatPhone, isValidPhone } from "@/lib/phone";
import { Pessoa } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar usuários.");
    return res.json();
  });

export default function UsuariosClient() {
  const { data, error, isLoading, mutate } = useSWR<{ pessoas: Pessoa[] }>(
    "/api/usuarios",
    fetcher
  );
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(
    null
  );

  const pessoas = data?.pessoas ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-16 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <h1 className="font-display text-3xl tracking-wide text-chalk">USUÁRIOS</h1>
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

      {isLoading && <p className="text-center text-chalk-muted">Carregando...</p>}
      {error && (
        <p className="text-center text-card-red">Não foi possível carregar os usuários.</p>
      )}

      <div className="space-y-3">
        {pessoas.map((pessoa) =>
          editandoId === pessoa.id ? (
            <LinhaEdicao
              key={pessoa.id}
              pessoa={pessoa}
              onCancelar={() => setEditandoId(null)}
              onSalvo={(atualizado) => {
                setEditandoId(null);
                setMensagem({ tipo: "sucesso", texto: "Usuário atualizado!" });
                mutate(
                  { pessoas: pessoas.map((p) => (p.id === atualizado.id ? atualizado : p)) },
                  false
                );
              }}
              onErro={(texto) => setMensagem({ tipo: "erro", texto })}
            />
          ) : (
            <LinhaLeitura
              key={pessoa.id}
              pessoa={pessoa}
              onEditar={() => setEditandoId(pessoa.id)}
            />
          )
        )}
      </div>
    </main>
  );
}

function LinhaLeitura({
  pessoa,
  onEditar,
}: {
  pessoa: Pessoa;
  onEditar: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pitch-line bg-pitch-surface p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          src={pessoa.foto}
          apelido={pessoa.apelido}
          className="h-10 w-10 text-sm"
        />
        <div>
          <p className="font-display text-lg tracking-wide text-chalk">
            {pessoa.apelido}
          </p>
          <p className="text-xs text-chalk-muted">
            {pessoa.nomeCompleto} · {formatPhone(pessoa.telefone)}
          </p>
          <p className="mt-1 text-xs text-chalk-muted">
            ⚽ {pessoa.gols} gols · 🎯 {pessoa.assistencias} assist.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Selo ativo={pessoa.ativo} rotuloAtivo="Ativo" rotuloInativo="Inativo" />
        {pessoa.administrador && (
          <span className="rounded-full border border-card-yellow/40 bg-card-yellow/10 px-2 py-1 text-xs text-card-yellow">
            Admin
          </span>
        )}
        <button
          onClick={onEditar}
          className="rounded-md border border-pitch-line px-3 py-1.5 text-xs text-chalk-muted hover:text-chalk"
        >
          Editar
        </button>
      </div>
    </div>
  );
}

function Selo({
  ativo,
  rotuloAtivo,
  rotuloInativo,
}: {
  ativo: boolean;
  rotuloAtivo: string;
  rotuloInativo: string;
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs ${
        ativo
          ? "border-grass/40 bg-grass/10 text-grass"
          : "border-card-red/40 bg-card-red/10 text-card-red"
      }`}
    >
      {ativo ? rotuloAtivo : rotuloInativo}
    </span>
  );
}

function LinhaEdicao({
  pessoa,
  onCancelar,
  onSalvo,
  onErro,
}: {
  pessoa: Pessoa;
  onCancelar: () => void;
  onSalvo: (pessoa: Pessoa) => void;
  onErro: (mensagem: string) => void;
}) {
  const [nomeCompleto, setNomeCompleto] = useState(pessoa.nomeCompleto);
  const [apelido, setApelido] = useState(pessoa.apelido);
  const [telefone, setTelefone] = useState(formatPhone(pessoa.telefone));
  const [ativo, setAtivo] = useState(pessoa.ativo);
  const [administrador, setAdministrador] = useState(pessoa.administrador);
  const [gols, setGols] = useState(String(pessoa.gols));
  const [assistencias, setAssistencias] = useState(String(pessoa.assistencias));
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nomeCompleto.trim() || !apelido.trim() || !isValidPhone(telefone)) {
      onErro("Preencha nome, apelido e um telefone válido.");
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch(`/api/usuarios/${pessoa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeCompleto,
          apelido,
          telefone,
          ativo,
          administrador,
          gols: Number(gols) || 0,
          assistencias: Number(assistencias) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        onErro(json.message ?? "Não foi possível salvar.");
        return;
      }
      onSalvo(json.pessoa);
    } catch {
      onErro("Falha de conexão ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-card-yellow/40 bg-pitch-raised p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-chalk-muted">Nome completo</label>
          <input
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            className="w-full rounded-md border border-pitch-line bg-pitch-surface px-3 py-2 text-sm text-chalk focus:border-grass focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-chalk-muted">Apelido</label>
          <input
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            className="w-full rounded-md border border-pitch-line bg-pitch-surface px-3 py-2 text-sm text-chalk focus:border-grass focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-chalk-muted">Telefone</label>
        <PhoneInput value={telefone} onChange={setTelefone} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-chalk-muted">Gols</label>
          <input
            type="number"
            min={0}
            value={gols}
            onChange={(e) => setGols(e.target.value)}
            className="w-full rounded-md border border-pitch-line bg-pitch-surface px-3 py-2 font-mono text-sm text-chalk focus:border-grass focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-chalk-muted">Assistências</label>
          <input
            type="number"
            min={0}
            value={assistencias}
            onChange={(e) => setAssistencias(e.target.value)}
            className="w-full rounded-md border border-pitch-line bg-pitch-surface px-3 py-2 font-mono text-sm text-chalk focus:border-grass focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-chalk">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 accent-grass"
          />
          Ativo
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={administrador}
            onChange={(e) => setAdministrador(e.target.checked)}
            className="h-4 w-4 accent-card-yellow"
          />
          Administrador
        </label>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancelar}
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
  );
}
