import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nomeCompleto: string;
      apelido: string;
      telefone: string;
      administrador: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    nomeCompleto: string;
    apelido: string;
    telefone: string;
    administrador: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    nomeCompleto: string;
    apelido: string;
    telefone: string;
    administrador: boolean;
  }
}
