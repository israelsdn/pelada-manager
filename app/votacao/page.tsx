import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import VotacaoClient from "@/app/votacao/VotacaoClient";

export default async function VotacaoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.administrador) redirect("/dashboard");

  return <VotacaoClient />;
}
