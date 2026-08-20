/**
 * Regras de negócio da pelada:
 * - dataInicio: sábado mais próximo (a partir de hoje, inclusive) às 19:00
 * - diaEvento: a segunda-feira seguinte a esse sábado às 20:30 (dia do jogo)
 * - dataTermino: essa mesma segunda-feira às 19:00 (fim das inscrições)
 *
 * Todas as datas são calculadas no horário local do servidor e convertidas
 * para ISO (UTC) antes de serem gravadas no banco.
 */

const SABADO = 6;
const SEGUNDA = 1;

function proximoDiaDaSemana(base: Date, diaSemana: number): Date {
  const resultado = new Date(base);
  const diff = (diaSemana - resultado.getDay() + 7) % 7;
  resultado.setDate(resultado.getDate() + diff);
  return resultado;
}

function comHorario(data: Date, horas: number, minutos: number): Date {
  const resultado = new Date(data);
  resultado.setHours(horas, minutos, 0, 0);
  return resultado;
}

export interface DatasPelada {
  dataInicio: string;
  diaEvento: string;
  dataTermino: string;
}

export function calcularDatasPelada(agora: Date = new Date()): DatasPelada {
  const sabado = proximoDiaDaSemana(agora, SABADO);
  const dataInicio = comHorario(sabado, 19, 0);

  const segunda = proximoDiaDaSemana(dataInicio, SEGUNDA);
  const diaEvento = comHorario(segunda, 20, 30);
  const dataTermino = comHorario(segunda, 19, 0);

  return {
    dataInicio: dataInicio.toISOString(),
    diaEvento: diaEvento.toISOString(),
    dataTermino: dataTermino.toISOString(),
  };
}

/** Converte um ISO string para o formato aceito por <input type="datetime-local">. */
export function paraDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Converte o valor de um <input type="datetime-local"> de volta para ISO string. */
export function deDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}
