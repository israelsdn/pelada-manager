"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhoneInput from "@/components/PhoneInput";
import Logo from "@/components/Logo";
import { isValidPhone } from "@/lib/phone";

export default function LoginPage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!isValidPhone(telefone)) {
      setErro("Informe um telefone válido, com DDD.");
      return;
    }

    setCarregando(true);
    const resultado = await signIn("credentials", {
      telefone,
      redirect: false,
    });
    setCarregando(false);

    if (resultado?.error) {
      setErro(resultado.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 shadow-floodlight">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="h-16 w-16" />
          </div>
          <h1 className="font-display text-5xl leading-none tracking-wide text-chalk">
            PELADA A.Q.S
          </h1>
          <p className="mt-2 text-sm text-chalk-muted">
            Entre com o número que você usou no cadastro
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-pitch-line bg-pitch-surface p-6"
        >
          <label htmlFor="telefone" className="mb-2 block text-sm text-chalk-muted">
            Telefone
          </label>
          <PhoneInput value={telefone} onChange={setTelefone} autoFocus required />

          {erro && (
            <p className="mt-3 rounded-md border border-card-red/40 bg-card-red/10 px-3 py-2 text-sm text-card-red">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-5 w-full rounded-md bg-grass py-3 font-display text-lg tracking-wide text-pitch transition-colors hover:bg-grass-dim disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-chalk-muted">
          Ainda não tem cadastro?{" "}
          <Link href="/cadastro" className="text-card-yellow hover:underline">
            Cadastre-se
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-chalk-muted">
          <Link href="/regras" className="hover:underline">
            Ver regras da pelada
          </Link>
        </p>
      </div>
    </main>
  );
}
