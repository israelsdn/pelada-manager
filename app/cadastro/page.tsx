"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhoneInput from "@/components/PhoneInput";
import Logo from "@/components/Logo";
import { isValidPhone } from "@/lib/phone";

export default function CadastroPage() {
  const router = useRouter();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [apelido, setApelido] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!nomeCompleto.trim() || !apelido.trim() || !isValidPhone(telefone)) {
      setErro("Preencha nome completo, apelido e um telefone válido.");
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeCompleto, apelido, telefone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.message ?? "Não foi possível concluir o cadastro.");
        return;
      }

      setSucesso(data.message);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="h-16 w-16" />
          </div>
          <p className="font-display text-sm tracking-[0.3em] text-card-yellow">
            NOVO NA PELADA?
          </p>
          <h1 className="font-display text-5xl leading-none tracking-wide text-chalk">
            CADASTRO
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-pitch-line bg-pitch-surface p-6"
        >
          <div>
            <label htmlFor="nomeCompleto" className="mb-2 block text-sm text-chalk-muted">
              Nome completo
            </label>
            <input
              id="nomeCompleto"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
              className="w-full rounded-md border border-pitch-line bg-pitch-raised px-4 py-3 text-chalk placeholder:text-chalk-muted/60 focus:border-grass focus:outline-none"
              placeholder="Ex: João da Silva"
            />
          </div>

          <div>
            <label htmlFor="apelido" className="mb-2 block text-sm text-chalk-muted">
              Apelido (vai aparecer na lista)
            </label>
            <input
              id="apelido"
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              required
              className="w-full rounded-md border border-pitch-line bg-pitch-raised px-4 py-3 text-chalk placeholder:text-chalk-muted/60 focus:border-grass focus:outline-none"
              placeholder="Ex: Joãozinho"
            />
          </div>

          <div>
            <label htmlFor="telefone" className="mb-2 block text-sm text-chalk-muted">
              Telefone
            </label>
            <PhoneInput value={telefone} onChange={setTelefone} required />
          </div>

          {erro && (
            <p className="rounded-md border border-card-red/40 bg-card-red/10 px-3 py-2 text-sm text-card-red">
              {erro}
            </p>
          )}
          {sucesso && (
            <p className="rounded-md border border-grass/40 bg-grass/10 px-3 py-2 text-sm text-grass">
              {sucesso}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-grass py-3 font-display text-lg tracking-wide text-pitch transition-colors hover:bg-grass-dim disabled:opacity-60"
          >
            {carregando ? "Enviando..." : "Cadastrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-chalk-muted">
          Já tem cadastro ativo?{" "}
          <Link href="/login" className="text-card-yellow hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
