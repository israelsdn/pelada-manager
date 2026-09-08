import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { buscarPessoaPorTelefone } from "@/lib/pessoa-service";
import { onlyDigits } from "@/lib/phone";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 120, // 5 minutos - expirado isso, precisa logar novamente
  },
  jwt: {
    maxAge: 60 * 5,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Telefone",
      credentials: {
        telefone: { label: "Telefone", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.telefone) {
          throw new Error("Informe o telefone.");
        }

        const telefone = onlyDigits(credentials.telefone);
        const pessoa = await buscarPessoaPorTelefone(telefone);

        if (!pessoa) {
          throw new Error("Não encontramos cadastro com esse telefone.");
        }

        if (!pessoa.ativo) {
          throw new Error(
            "Esse usuário existe, mas ainda não foi ativado pela administração."
          );
        }

        return {
          id: pessoa.id,
          nomeCompleto: pessoa.nomeCompleto,
          apelido: pessoa.apelido,
          telefone: pessoa.telefone,
          administrador: !!pessoa.administrador,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.nomeCompleto = (user as any).nomeCompleto;
        token.apelido = (user as any).apelido;
        token.telefone = (user as any).telefone;
        token.administrador = (user as any).administrador;
      }
      if (trigger === "update" && session) {
        if (session.nomeCompleto !== undefined) {
          token.nomeCompleto = session.nomeCompleto;
        }
        if (session.apelido !== undefined) {
          token.apelido = session.apelido;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        nomeCompleto: token.nomeCompleto as string,
        apelido: token.apelido as string,
        telefone: token.telefone as string,
        administrador: token.administrador as boolean,
      } as any;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
