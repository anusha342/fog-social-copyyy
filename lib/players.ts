import { ObjectId } from "mongodb"
import type { WithId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import type { PlayerDoc } from "@/types"

export type Player = WithId<PlayerDoc>

async function collection() {
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

  // 1. First, check if there's a cabinet-created player (linked by email, but without this google_id)
  let cabinetPlayer = data.email
    ? await col.findOne({ email: data.email, google_id: { $ne: data.google_id } })
    : null

  if (cabinetPlayer) {
    // Clean up any empty/duplicate account created by direct Google Sign-in
    await col.deleteMany({ google_id: data.google_id, _id: { $ne: cabinetPlayer._id } })

    const result = await col.findOneAndUpdate(
      { _id: cabinetPlayer._id },
      {
        $set: {
          google_id: data.google_id,
          name: cabinetPlayer.name || data.name,
          avatar_url: cabinetPlayer.avatar_url || data.avatar_url,
          email: data.email,
          updated_at: now,
        }
      },
      { returnDocument: "after" }
    )
    return result!
  }

  // 2. Otherwise look up by google_id
  let player = await col.findOne({ google_id: data.google_id })

  if (player) {
    const result = await col.findOneAndUpdate(
      { _id: player._id },
      {
        $set: {
          name: player.name || data.name,
          avatar_url: player.avatar_url || data.avatar_url,
          email: data.email,
          updated_at: now,
        }
      },
      { returnDocument: "after" }
    )
    return result!
  } else {
    // 3. Create a brand new record
    const result = await col.findOneAndUpdate(
      { google_id: data.google_id },
      {
        $set: {
          email: data.email,
          updated_at: now,
        },
        $setOnInsert: {
          name: data.name,
          avatar_url: data.avatar_url,
          created_at: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    )
    return result!
  }
}

export async function getPlayerByGoogleId(
  googleId: string
): Promise<Player | null> {
  const col = await collection()
  return col.findOne({ google_id: googleId })
}

export async function getPlayerByEmail(
  email: string
): Promise<Player | null> {
  const col = await collection()
  return col.findOne({ email })
}

export async function getPlayerByPid(
  pid: string
): Promise<Player | null> {
  const col = await collection()
  return col.findOne({ _id: new ObjectId(pid) })
}
