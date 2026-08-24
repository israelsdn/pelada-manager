import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import GolsClient from "@/app/gols/GolsClient";

export default async function GolsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.administrador) redirect("/dashboard");

  return <GolsClient />;
}
