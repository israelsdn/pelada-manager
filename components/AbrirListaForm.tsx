"use client";

import { useState } from "react";
import {
  calcularDatasPelada,
  deDatetimeLocal,
  paraDatetimeLocal,
} from "@/lib/date-utils";

interface AbrirListaFormProps {
  onConfirmar: (datas: {
    dataInicio: string;
    diaEvento: string;
    dataTermino: string;
    dataFim: string;
  }) => void;
  carregando: boolean;
}

export default function AbrirListaForm({
  onConfirmar,
  carregando,
}: AbrirListaFormProps) {
  const padrao = calcularDatasPelada();
  const [aberto, setAberto] = useState(false);
  const [dataInicio, setDataInicio] = useState(
    paraDatetimeLocal(padrao.dataInicio),
  );
  const [diaEvento, setDiaEvento] = useState(
    paraDatetimeLocal(padrao.diaEvento),
  );
  const [dataTermino, setDataTermino] = useState(
    paraDatetimeLocal(padrao.dataTermino),
  );
  const [dataFim, setDataFim] = useState(paraDatetimeLocal(padrao.dataFim));

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-5 rounded-md bg-card-yellow px-6 py-3 font-display text-lg tracking-wide text-pitch hover:brightness-95"
      >
        Abrir lista
      </button>
    );
  }

  return (
    <div className="mt-5 space-y-4 rounded-md border border-pitch-line bg-pitch-raised p-5 text-left">
      <p className="text-center text-xs uppercase tracking-widest text-chalk-muted">
        Datas já vêm preenchidas com o padrão — ajuste se precisar
      </p>

      <div>
        <label className="mb-1 block text-xs text-chalk-muted">
          Início das inscrições
        </label>
        <input
          type="datetime-local"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="w-full rounded-md border border-pitch-line bg-pitch-surface px-3 py-2 font-mono text-sm text-chalk focus:border-grass focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-chalk-muted">
          Dia da pelada
        </label>
        <input
          type="datetime-local"
          value={diaEvento}
          onChange={(e) => setDiaEvento(e.target.value)}
          className="w-full rounded-md border border-pitch-line bg-pitch-surface px-3 py-2 font-mono text-sm text-chalk focus:border-grass focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-chalk-muted">
          Fim das inscrições
        </label>
        <input
          type="datetime-local"
          value={dataTermino}
          onChange={(e) => setDataTermino(e.target.value)}
          className="w-full rounded-md border border-pitch-line bg-pitch-surface px-3 py-2 font-mono text-sm text-chalk focus:border-grass focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-chalk-muted">
          Fim do evento
        </label>
        <input
          type="datetime-local"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="w-full rounded-md border border-pitch-line bg-pitch-surface px-3 py-2 font-mono text-sm text-chalk focus:border-grass focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-chalk-muted">
          Até esse horário a lista continua aparecendo no dashboard e dá pra
          registrar gols. Depois disso, some da tela.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setAberto(false)}
          disabled={carregando}
          className="flex-1 rounded-md border border-pitch-line py-2 text-sm text-chalk-muted hover:text-chalk disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={() =>
            onConfirmar({
              dataInicio: deDatetimeLocal(dataInicio),
              diaEvento: deDatetimeLocal(diaEvento),
              dataTermino: deDatetimeLocal(dataTermino),
              dataFim: deDatetimeLocal(dataFim),
            })
          }
          disabled={carregando}
          className="flex-1 rounded-md bg-card-yellow py-2 font-display text-base tracking-wide text-pitch hover:brightness-95 disabled:opacity-60"
        >
          {carregando ? "Abrindo..." : "Confirmar abertura"}
        </button>
      </div>
    </div>
  );
}
