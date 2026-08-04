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
  env: string
  player: {
    google_id: string
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
  played_at: string
  players: Array<{
    name: string
    avatar_url: string
  }>
  center?: {
    _id: string
    name: string | null
  }
}

/**
 * Response from `GET /api/v1/tournament/:id/leaderboard/player/:player_id`.
 * `player` is omitted when no player_id is in the path.
 */
export interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  player?: {
    rank: number
    best_score: number
  }
}

export interface TournamentReward {
  rank: number
  title: string
  prize_money: string
  image_url: string
}

/** One tournament returned by `GET /api/v1/tournaments`. */
export interface Tournament {
  _id: string
  /** Optional human-readable name. Falls back to date-based label when absent. */
  name?: string
  status: "active" | "past" | "upcoming"
  player_count: number
  top_score?: number
  top_player?: { name: string; avatar_url: string }
  started_at: string
  ended_at?: string | null
  rewards?: TournamentReward[]
  banner_url?: string | null
}

/** Response from `GET /api/v1/tournaments`. */
export interface TournamentsResponse {
  tournaments: Tournament[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// ── UI ─────────────────────────────────────────────────────────────────────────

/**
 * Possible failure states on the join page.
 * Mirrors the sync server HTTP error codes plus a generic network failure.
 */
export type JoinErrorCode = 404 | 409 | 410 | "network"
