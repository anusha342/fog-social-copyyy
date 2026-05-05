import type { WithId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import type { PlayerDoc } from "@/types"

export type Player = WithId<PlayerDoc>

function collection() {
  return clientPromise.then((client) =>
    client.db().collection<PlayerDoc>("players")
  )
}

/**
 * Insert or update a player record on every Google sign-in.
 * Profile fields (name, avatar) are always refreshed; created_at is set once.
 */
export async function upsertPlayer(data: {
  google_id: string
  name: string | null
  email: string | null
  avatar_url: string | null
}): Promise<Player> {
  const col = await collection()
  const now = new Date()

  const result = await col.findOneAndUpdate(
    { google_id: data.google_id },
    {
      $set: {
        name: data.name,
        email: data.email,
        avatar_url: data.avatar_url,
        updated_at: now,
      },
      $setOnInsert: { created_at: now },
    },
    { upsert: true, returnDocument: "after" }
  )

  return result!
}

export async function getPlayerByGoogleId(
  googleId: string
): Promise<Player | null> {
  const col = await collection()
  return col.findOne({ google_id: googleId })
}
