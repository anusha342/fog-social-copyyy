import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getUrlForEnv } from "@/lib/sync-env"

const SYNC = process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? ""

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000) {
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
    throw err
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get("tournamentId")
    const googleId = searchParams.get("googleId")
    const env = searchParams.get("env") ?? "dev"

    if (!tournamentId || !googleId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const url = getUrlForEnv(`${SYNC}/api/v1/player/${googleId}/gameplays?tournament_id=${tournamentId}&limit=50`, env)
    const res = await fetchWithTimeout(url, { next: { revalidate: 3 } })
    if (!res.ok) {
      return NextResponse.json({ gameplays: [] })
    }

    const data = await res.json()
    const gameplays = data.gameplays ?? []

    try {
      const client = await clientPromise
      const { ObjectId } = require("mongodb")
      let queryTournamentId: any = tournamentId
      try {
        queryTournamentId = new ObjectId(tournamentId)
      } catch {}

      const dbName = env === "prod" ? "hyper-grid" : `hyper-grid-${env}`
      let db = client.db(dbName)
      let mongoGameplays = await db.collection("tournament_gameplays").find({
        $or: [
          { tournament_id: tournamentId },
          { tournament_id: queryTournamentId }
        ]
      }).toArray()

      if (mongoGameplays.length === 0 && dbName !== "hyper-grid-dev") {
        db = client.db("hyper-grid-dev")
        mongoGameplays = await db.collection("tournament_gameplays").find({
          $or: [
            { tournament_id: tournamentId },
            { tournament_id: queryTournamentId }
          ]
        }).toArray()
      }

      const levelMap = new Map()
      for (const mg of mongoGameplays) {
        if (mg.gameplay_id && mg.level !== undefined) {
          levelMap.set(mg.gameplay_id.toString(), mg.level)
        }
      }

      for (const g of gameplays) {
        if (levelMap.has(g.gameplay_id)) {
          g.level = levelMap.get(g.gameplay_id)
        }
      }
    } catch (e) {
      console.error("Failed to merge gameplay levels in API route:", e)
    }

    return NextResponse.json({ gameplays })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
