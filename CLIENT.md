# CLIENT.md — Tournament Player App

This file provides context for the Next.js player-facing web app that powers the tournament experience.

---

## What This App Is

A mobile web app that opens when a player scans a QR code at an arcade machine. Its only job is to authenticate the player via Google and link them to the active tournament session running on that machine.

After joining, the player sees a live leaderboard that updates in real time as other players submit scores.

---

## Tournament Flow (Client Perspective)

```
1. Player scans QR at arcade machine
   URL: https://<this-app>/join?t=<tournament_id>&s=<session_code>&env=<env>

2. App reads t, s, and env from query params — hold onto all three for the entire flow

3. Show "Checking session…" spinner, then validate the session before anything else:
   GET /api/v1/tournament/:tournament_id/session/:session_code?env=<env>
   ← 404 → show "Session not found" error, stop
   ← 410 → show "Session expired" error, stop (do not show sign-in)
   ← 200 → session is valid, continue

4. If player is not signed in → show Google sign-in (NextAuth)
   If already signed in → skip straight to step 5

5. On successful Google login, call the join endpoint:
   POST /api/v1/tournament/:tournament_id/join
   Body: { session_code, player: { google_id }, env }
   ← { success: true, player: { _id, name, avatar_url } }

6. Store the returned player._id — needed for the player leaderboard lookup

7. Fetch leaderboard snapshot (store locally for offline use):
   GET /api/v1/tournament/:tournament_id/leaderboard/snapshot?env=<env>
   ← { top10: [...], scores: [...], total, snapshot_at }

8. Show leaderboard, poll every ~5s when online:
   GET /api/v1/tournament/:tournament_id/leaderboard/player/:player_id?env=<env>
   ← { leaderboard: [...top10], player: { rank, best_score } }

   If offline, use the stored snapshot to estimate rank:
   scores.filter(s => s > myScore).length + 1  → show as "~rank 4"
```

---

## Auth — NextAuth Setup

Use NextAuth with the Google provider. The join API only needs the player's `google_id` (Google `sub`), which the server uses to look up the player's full profile from the social database.

Add this to your NextAuth config so `token.sub` is available on the session:

```js
// app/api/auth/[...nextauth]/route.js (or pages/api/auth/[...nextauth].js)
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
],
callbacks: {
  async session({ session, token }) {
    session.user.google_id = token.sub;  // Google sub claim
    return session;
  },
},
```

The join body's `player` field only needs `google_id`:

```js
{
  google_id: session.user.google_id,  // token.sub
}
```

The server resolves name, email, and avatar from the social database — do not send them from the client.

---

## API Endpoints Used by This App

Base URL is the sync server (`NEXT_PUBLIC_SYNC_SERVER_URL` env var).

| Method | Path | Auth | When called |
|--------|------|------|-------------|
| `GET` | `/api/v1/tournament/:t/session/:s?env=` | none | On page load, before sign-in |
| `POST` | `/api/v1/tournament/:t/join` | none | Immediately after Google login |
| `GET` | `/api/v1/tournament/:t/leaderboard/snapshot?env=` | none | Once after joining — store locally |
| `GET` | `/api/v1/tournament/:t/leaderboard/player/:player_id?env=` | none | Every ~5s after joining (when online) |
| `GET` | `/api/v1/player/:google_id/stats?env=` | none | Player dashboard — aggregate stats |
| `GET` | `/api/v1/player/:google_id/gameplays?env=&limit=` | none | Player dashboard — full gameplay history |
| `GET` | `/api/v1/player/:google_id/gameplays?env=&tournament_id=&limit=` | none | My Plays tab — gameplays scoped to a tournament |

`t` (tournament_id), `s` (session_code), and `env` all come from the URL query params on page load.

### Session check — response

```json
{ "status": "waiting" }
```

Error cases:
- `404` — session not found (bad QR or already deleted)
- `410` — session expired (10-minute TTL from when the arcade created it)

### Join — request body shape

```json
{
  "session_code": "A3F9K2",
  "player": {
    "google_id": "<google sub>"
  },
  "env": "prod"
}
```

`session_code` is case-insensitive — the server normalises it to uppercase.

### Join — response

```json
{
  "success": true,
  "player": { "_id": "...", "name": "Jane Doe", "avatar_url": "https://..." }
}
```

Error cases:
- `404` — session not found, or player has no social login account
- `410` — session expired (10-minute TTL from when the arcade created it)
- `409` — session already played

### Leaderboard — response

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "score": 4200,
      "played_at": "2026-05-07T10:00:00.000Z",
      "players": [{ "name": "Jane Doe", "avatar_url": "https://..." }]
    }
  ],
  "player": { "rank": 4, "best_score": 1500 }
}
```

`leaderboard` contains up to 10 entries. `player.rank` is based on the player's best score across all their plays in this tournament.

For a full paginated leaderboard (e.g. a results screen) use:
```
GET /api/v1/tournament/:t/leaderboard?page=1&limit=10&env=<env>
← { leaderboard: [...], pagination: { page, limit, total, total_pages } }
```

### Leaderboard Snapshot — response

```json
{
  "top10": [
    {
      "rank": 1,
      "score": 4200,
      "played_at": "2026-05-07T10:00:00.000Z",
      "players": [{ "name": "Jane Doe", "avatar_url": "https://..." }]
    }
  ],
  "scores": [4200, 3800, 3500, 2900, 1500],
  "total": 42,
  "snapshot_at": "2026-05-09T10:00:00.000Z"
}
```

Fetch once after joining and store in memory (or localStorage). When the player goes offline, use `scores` to estimate rank:

```js
const estimatedRank = scores.filter(s => s > myScore).length + 1;
// Display as "~rank 4" to signal it's approximate
```

`snapshot_at` tells you how stale the data is. Refresh the snapshot when the player comes back online.

### Player Stats — response

```json
{
  "games_played": 5,
  "best_score": 4200,
  "global_rank": 12
}
```

- `games_played` — total tournament gameplays this player has been part of
- `best_score` — highest score across all those gameplays
- `global_rank` — rank by best score vs all other players across all tournaments; `null` if the player has no gameplays yet

### Player Gameplays — response

```json
{
  "gameplays": [
    {
      "gameplay_id": "69fc8582fe81ba17c95bfd1d",
      "tournament_id": "69f891381c77e5382a582b9c",
      "score": 670,
      "played_at": "2026-05-07T12:30:08.037Z"
    }
  ]
}
```

Sorted newest first. `limit` defaults to `10`, max `100`. Pass `tournament_id` to scope results to a specific tournament (My Plays tab) — omit it for the full cross-tournament history view. Both endpoints look up the player by `google_id` from the social database — pass `session.user.google_id` (the Google `sub`) directly in the URL.

---

## Key Rules

- Always read `t`, `s`, and `env` from query params on mount — do not hardcode or store in localStorage.
- Always validate the session (step 3) before showing the sign-in UI. A `410` means the player must rescan — do not prompt them to log in.
- Do not call the join endpoint more than once per session load. If the player refreshes, calling join again is safe — the server uses `$addToSet` so duplicate joins are ignored.
- The session expires 10 minutes after the arcade created it, not after the player joins. If the player takes too long to log in, the `410` response means they need to rescan the QR.
- `google_id` is the stable identifier for a player across visits. The server will not create a duplicate account if they scan a QR again in a future tournament.
