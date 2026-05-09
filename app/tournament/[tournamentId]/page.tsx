import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { TournamentView } from "@/components/TournamentView"

export default async function TournamentPage({
  params,
  searchParams,
}: {
  params: Promise<{ tournamentId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  const { tournamentId } = await params
  const sp = await searchParams

  const env = Array.isArray(sp.env) ? sp.env[0] : (sp.env ?? "prod")
  const pid = Array.isArray(sp.pid) ? sp.pid[0] : sp.pid

  return (
    <main>
      <TournamentView
        tournamentId={tournamentId}
        googleId={session.user.google_id}
        env={env}
        pid={pid}
        name={session.user.name}
        image={session.user.image}
      />
    </main>
  )
}
