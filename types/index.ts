// ---- Pessoa ----
export interface Pessoa {
  id: string;
  nomeCompleto: string;
  apelido: string;
  telefone: string; // somente números
  ativo: boolean;
  administrador: boolean;
  gols: number;
  assistencias: number;
  foto?: string | null;
}

// ---- Inscrições da Pelada ----
export type Posicao = "goleiro" | "jogador";
export type StatusInscricao = "goleiro" | "jogador" | "suplente";

export interface ItemLista {
  id: string; // id da inscrição
  pessoaId: string;
  apelido: string;
  foto?: string | null;
  posicao?: Posicao; // presente somente para quem caiu na lista de suplentes
}

// ---- Pelada ----
export interface Pelada {
  id: string;
  dataInicio: string; // ISO - sábado 19h (abertura)
  diaEvento: string; // ISO - segunda 20h30 (dia do jogo)
  dataTermino: string; // ISO - segunda 19h (fim das inscrições)
  dataFim: string; // ISO - horário em que o evento termina
  responsavelId: string;
  atualizadoEm: string; // usado para o polling leve de "mudou algo?"
  listaGoleiros: ItemLista[];
  listaJogadores: ItemLista[];
  listaSuplentes: ItemLista[];
}

export const LIMITE_GOLEIROS = 3;
export const LIMITE_JOGADORES = 12;

// ---- Regras ----
export interface Regras {
  conteudo: string;
  atualizadoEm: string;
  atualizadoPorApelido?: string;
}

// ---- Votação de notas ----
export interface Voto {
  votadoId: string;
  nota: number;
}

export interface NotaMensal {
  pessoaId: string;
  apelido: string;
  foto?: string | null;
  media: number;
  totalVotos: number;
}

// ---- Superclássico ----
export interface VencedorSuperclassico {
  pessoaId: string;
  apelido: string;
  foto?: string | null;
}

export interface EdicaoSuperclassico {
  id: string;
  data: string; // YYYY-MM-DD
  vencedores: VencedorSuperclassico[];
}

// ---- Sessão NextAuth ----
export interface SessaoUsuario {
  id: string;
  nomeCompleto: string;
  apelido: string;
  telefone: string;
  administrador: boolean;
}
