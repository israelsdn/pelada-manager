import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SuperclassicoClient from "@/app/superclassico/SuperclassicoClient";

export default async function SuperclassicoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <SuperclassicoClient administrador={session.user.administrador} />;
}
