import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import UsuariosClient from "@/app/usuarios/UsuariosClient";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.administrador) redirect("/dashboard");

  return <UsuariosClient />;
}
