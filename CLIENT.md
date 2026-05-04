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
   URL: https://<this-app>/join?t=<tournament_id>&s=<session_code>

2. App reads t and s from query params — hold onto both for the entire flow

3. If player is not logged in → show Google sign-in (NextAuth)
   If already logged in → skip straight to step 4

4. On successful Google login, call the sync server join endpoint:
   POST /api/v1/tournament/:tournament_id/join
   Body: { session_code, player: { google_id, name, email, avatar_url } }
   ← { success: true, player: { _id, name, avatar_url } }

5. Store the returned player._id — needed for leaderboard rank lookup

6. Show leaderboard, poll every ~5s:
   GET /api/v1/tournament/:tournament_id/leaderboard?player_id=<player._id>
   ← { top10: [...], player: { rank, score } }
```

---

## Auth — NextAuth Setup

Use NextAuth with the Google provider. The join API expects the player's Google identity, so the session must expose it.

Add this to your NextAuth config so `account.providerAccountId` (the Google `sub`) and the Google profile are available when calling the join endpoint:

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

The player object sent to the join API maps directly from `session.user`:

```js
{
  google_id:  session.user.google_id,   // token.sub
  name:       session.user.name,
  email:      session.user.email,
  avatar_url: session.user.image,       // Google profile picture
}
```

---

## API Endpoints Used by This App

Base URL is the sync server (`NEXT_PUBLIC_SYNC_SERVER_URL` env var).

| Method | Path | Auth | When called |
|--------|------|------|-------------|
| `POST` | `/api/v1/tournament/:t/join` | none | Immediately after Google login |
| `GET` | `/api/v1/tournament/:t/leaderboard?player_id=xxx` | none | Every ~5s after joining |

Both `t` (tournament_id) and `s` (session_code) come from the URL query params on page load.

### Join — request body shape

```json
{
  "session_code": "A3F9K2",
  "player": {
    "google_id": "<google sub>",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar_url": "https://..."
  }
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
- `404` — session_code not found or wrong tournament
- `410` — session expired (10-minute TTL from when the arcade created it)
- `409` — session already played

### Leaderboard — response

```json
{
  "top10": [
    { "rank": 1, "score": 4200, "player": { "name": "...", "avatar_url": "..." } }
  ],
  "player": { "rank": 4, "score": 1500 }
}
```

`player` is omitted if no `player_id` query param is provided.

---

## Key Rules

- Always read `t` and `s` from query params on mount — do not hardcode or store in localStorage.
- Do not call the join endpoint more than once per session load. If the player refreshes, calling join again is safe — the server uses `$addToSet` so duplicate joins are ignored.
- The session expires 10 minutes after the arcade created it, not after the player joins. If the player takes too long to log in, the `410` response means they need to rescan the QR.
- `google_id` is the stable identifier for a player across visits. The server will not create a duplicate account if they scan a QR again in a future tournament.
