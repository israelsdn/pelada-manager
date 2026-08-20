"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetIso: string;
  label?: string;
}

function calcularRestante(targetIso: string) {
  const diffMs = new Date(targetIso).getTime() - Date.now();
  const encerrado = diffMs <= 0;
  const totalSegundos = Math.max(0, Math.floor(diffMs / 1000));

  const dias = Math.floor(totalSegundos / 86400);
  const horas = Math.floor((totalSegundos % 86400) / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  return { encerrado, dias, horas, minutos, segundos };
}

function Digito({ valor, unidade }: { valor: number; unidade: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-md border border-pitch-line bg-pitch-raised px-3 py-2 font-mono text-2xl font-semibold tabular-nums text-chalk sm:text-3xl">
        {String(valor).padStart(2, "0")}
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-widest text-chalk-muted">
        {unidade}
      </span>
    </div>
  );
}

export default function Countdown({
  targetIso,
  label = "Fecha a lista em",
}: CountdownProps) {
  const [tempo, setTempo] = useState(() => calcularRestante(targetIso));

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTempo(calcularRestante(targetIso));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [targetIso]);

  if (tempo.encerrado) {
    return (
      <div className="rounded-md border border-card-red/40 bg-card-red/10 px-4 py-3 text-center">
        <p className="font-display text-xl tracking-wide text-card-red">
          Inscrições encerradas
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-center text-xs uppercase tracking-[0.2em] text-chalk-muted">
        {label}
      </p>
      <div className="flex justify-center gap-3">
        <Digito valor={tempo.dias} unidade="dias" />
        <Digito valor={tempo.horas} unidade="hrs" />
        <Digito valor={tempo.minutos} unidade="min" />
        <Digito valor={tempo.segundos} unidade="seg" />
      </div>
    </div>
  );
}
