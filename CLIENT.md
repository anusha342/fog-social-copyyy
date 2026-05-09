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

7. Show leaderboard, poll every ~5s:
   GET /api/v1/tournament/:tournament_id/leaderboard/player/:player_id?env=<env>
   ← { leaderboard: [...top10], player: { rank, best_score } }
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
| `GET` | `/api/v1/tournament/:t/leaderboard/player/:player_id?env=` | none | Every ~5s after joining |

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

---

## Key Rules

- Always read `t`, `s`, and `env` from query params on mount — do not hardcode or store in localStorage.
- Always validate the session (step 3) before showing the sign-in UI. A `410` means the player must rescan — do not prompt them to log in.
- Do not call the join endpoint more than once per session load. If the player refreshes, calling join again is safe — the server uses `$addToSet` so duplicate joins are ignored.
- The session expires 10 minutes after the arcade created it, not after the player joins. If the player takes too long to log in, the `410` response means they need to rescan the QR.
- `google_id` is the stable identifier for a player across visits. The server will not create a duplicate account if they scan a QR again in a future tournament.
