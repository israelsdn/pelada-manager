import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import RankingClient from "@/app/ranking/RankingClient";

export default async function RankingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <RankingClient />;
}
