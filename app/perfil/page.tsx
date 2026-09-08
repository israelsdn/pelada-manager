import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PerfilClient from "@/app/perfil/PerfilClient";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <PerfilClient />;
}
