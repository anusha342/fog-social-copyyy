import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { TournamentView } from "@/components/TournamentView"
import { getPlayerByEmail, getPlayerByGoogleId } from "@/lib/players"
import { SYNC_ENV, getUrlForEnv, getSyncOfflineStatus, setSyncOffline } from "@/lib/sync-env"
import clientPromise from "@/lib/mongodb"

const SYNC = process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? ""

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000) {
  if (getSyncOfflineStatus()) {
    throw new Error("Sync server is offline")
  }
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    setSyncOffline(true)
    throw err
  }
}

async function fetchTournamentDetails(tournamentId: string, env: string) {
  try {
    const url = getUrlForEnv(`${SYNC}/api/v1/tournaments?limit=50`, env)
    const res = await fetchWithTimeout(url, { next: { revalidate: 3 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.tournaments?.find((t: any) => t._id === tournamentId) ?? null
  } catch {
    return null
  }
}

async function fetchLeaderboard(tournamentId: string, env: string, playerId?: string) {
  try {
    const url = playerId
      ? getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard/player/${playerId}`, env)
      : getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard?page=1&limit=10`, env)
    const res = await fetchWithTimeout(url, { next: { revalidate: 3 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchPlays(tournamentId: string, googleId: string, env: string) {
  try {
    const url = getUrlForEnv(`${SYNC}/api/v1/player/${googleId}/gameplays?tournament_id=${tournamentId}&limit=50`, env)
    const res = await fetchWithTimeout(url, { next: { revalidate: 3 } })
    const data = await res.json()
    const gameplays = data.gameplays ?? []
    try {
      const client = await clientPromise
      const dbName = env === "prod" ? "hyper-grid" : `hyper-grid-${env}`
      let db = client.db(dbName)
      let mongoGameplays = await db.collection("tournament_gameplays").find({
        tournament_id: tournamentId
      }).toArray()

      if (mongoGameplays.length === 0 && dbName !== "hyper-grid-dev") {
        db = client.db("hyper-grid-dev")
        mongoGameplays = await db.collection("tournament_gameplays").find({
          tournament_id: tournamentId
        }).toArray()
      }

      const levelMap = new Map()
      for (const mg of mongoGameplays) {
        if (mg.gameplay_id && mg.level !== undefined) {
          levelMap.set(mg.gameplay_id, mg.level)
        }
      }

      for (const g of gameplays) {
        if (levelMap.has(g.gameplay_id)) {
          g.level = levelMap.get(g.gameplay_id)
        }
      }
    } catch (e) {
      console.error("Failed to merge gameplay levels:", e)
    }
    return gameplays
  } catch {
    return []
  }
}

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

  const env = Array.isArray(sp.env) ? sp.env[0] : (sp.env ?? SYNC_ENV)
  const pid = Array.isArray(sp.pid) ? sp.pid[0] : sp.pid

  // Resolve player from email first to support dynamic account switching by email address
  let dbPlayer = session.user.email ? await getPlayerByEmail(session.user.email) : null
  if (!dbPlayer && session.user.google_id) {
    dbPlayer = await getPlayerByGoogleId(session.user.google_id)
  }

  const resolvedGoogleId = dbPlayer?.google_id || session.user.google_id
  const resolvedPid = pid || (dbPlayer ? dbPlayer._id.toString() : undefined)

  const [tournamentData, leaderboardData, playsData] = await Promise.all([
    fetchTournamentDetails(tournamentId, env),
    fetchLeaderboard(tournamentId, env, resolvedPid),
    resolvedGoogleId ? fetchPlays(tournamentId, resolvedGoogleId, env) : Promise.resolve([]),
  ])

  return (
    <main>
      <TournamentView
        tournamentId={tournamentId}
        googleId={resolvedGoogleId}
        env={env}
        pid={resolvedPid}
        name={dbPlayer?.name ?? session.user.name}
        image={dbPlayer?.avatar_url ?? session.user.image}
        initialTournament={tournamentData}
        initialLeaderboard={leaderboardData}
        initialPlays={playsData}
      />
    </main>
  )
}
