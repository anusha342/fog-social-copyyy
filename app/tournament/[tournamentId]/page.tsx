import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { TournamentView } from "@/components/TournamentView"
import { getPlayerByEmail, getPlayerByGoogleId } from "@/lib/players"

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

  // Resolve player from email first to support dynamic account switching by email address
  let dbPlayer = session.user.email ? await getPlayerByEmail(session.user.email) : null
  if (!dbPlayer && session.user.google_id) {
    dbPlayer = await getPlayerByGoogleId(session.user.google_id)
  }

  const resolvedGoogleId = dbPlayer ? dbPlayer.google_id : session.user.google_id
  const resolvedPid = pid || (dbPlayer ? dbPlayer._id.toString() : undefined)

  return (
    <main>
      <TournamentView
        tournamentId={tournamentId}
        googleId={resolvedGoogleId}
        env={env}
        pid={resolvedPid}
        name={dbPlayer?.name ?? session.user.name}
        image={dbPlayer?.avatar_url ?? session.user.image}
      />
    </main>
  )
}
