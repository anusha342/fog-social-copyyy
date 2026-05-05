// ── Database ───────────────────────────────────────────────────────────────────

/**
 * Document shape for the MongoDB `players` collection.
 * Use as `Collection<PlayerDoc>` — the driver wraps it in `WithId<PlayerDoc>`,
 * adding `_id: ObjectId` at the query layer without polluting this type.
 */
export interface PlayerDoc {
  /** Stable Google identity (JWT `sub` claim). Never changes across visits. */
  google_id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  created_at: Date
  updated_at: Date
}

// ── Sync server ────────────────────────────────────────────────────────────────

/**
 * Player shape returned by the sync server.
 * `_id` is the sync server's own ObjectId serialised to a string.
 */
export interface SyncPlayer {
  _id: string
  name: string
  avatar_url: string
}

/** Body sent to `POST /api/v1/tournament/:id/join`. */
export interface JoinRequestBody {
  session_code: string
  player: {
    google_id: string
    name: string | null
    email: string | null
    avatar_url: string | null
  }
}

/** Success response from the join endpoint. */
export interface JoinResponse {
  success: boolean
  player: SyncPlayer
}

/** One row in the leaderboard. */
export interface LeaderboardEntry {
  rank: number
  score: number
  player: {
    name: string
    avatar_url: string
  }
}

/**
 * Response from `GET /api/v1/tournament/:id/leaderboard`.
 * `player` is omitted when no `player_id` query param is supplied.
 */
export interface LeaderboardData {
  top10: LeaderboardEntry[]
  player?: {
    rank: number
    score: number
  }
}

// ── UI ─────────────────────────────────────────────────────────────────────────

/**
 * Possible failure states on the join page.
 * Mirrors the sync server HTTP error codes plus a generic network failure.
 */
export type JoinErrorCode = 404 | 409 | 410 | "network"
