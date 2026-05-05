"use client"

import { useState, useEffect, useCallback } from "react"
import { signIn } from "next-auth/react"
import Image from "next/image"
import type { Session } from "next-auth"
import { Trophy, Medal, AlertCircle, QrCode, Loader2, WifiOff } from "lucide-react"
import type { JoinErrorCode, LeaderboardData } from "@/types"

// ── Constants ─────────────────────────────────────────────────────────────────

const SYNC = process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? ""

const ERROR_COPY: Record<JoinErrorCode, { title: string; desc: string }> = {
  404: {
    title: "Session not found",
    desc: "This QR code didn't match an active game session.",
  },
  409: {
    title: "Session already played",
    desc: "This game session has already ended.",
  },
  410: {
    title: "Session expired",
    desc: "The 10-minute window has passed. Rescan the QR at the machine to start fresh.",
  },
  network: {
    title: "Connection error",
    desc: "Check your internet connection and try again.",
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function Avatar({
  src,
  name,
  size = 32,
}: {
  src: string
  name: string
  size?: number
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className="size-full object-cover"
      />
    )
  }
  return (
    <span className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  tournamentId: string
  sessionCode: string
  session: Session | null
}

export function JoinFlow({ tournamentId, sessionCode, session }: Props) {
  const [phase, setPhase] = useState<"checking" | "unauthenticated" | "joining" | "error" | "leaderboard">("checking")
  const [errorCode, setErrorCode] = useState<JoinErrorCode | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [isLive, setIsLive] = useState(false)
  // Incrementing this re-triggers the join effect (used for retry).
  const [retryKey, setRetryKey] = useState(0)

  // ── Session pre-check ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const res = await fetch(
          `${SYNC}/api/v1/tournament/${tournamentId}/session/${sessionCode}`
        )
        if (cancelled) return

        if (res.status === 404) {
          setErrorCode(404)
          setPhase("error")
        } else if (res.status === 410) {
          setErrorCode(410)
          setPhase("error")
        } else {
          setPhase(session ? "joining" : "unauthenticated")
        }
      } catch {
        if (!cancelled) {
          // Network error during pre-check — let the join attempt surface it.
          setPhase(session ? "joining" : "unauthenticated")
        }
      }
    }

    checkSession()
    return () => { cancelled = true }
  }, [tournamentId, sessionCode, session])

  // ── Join ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "joining") return
    if (!session) return

    let cancelled = false
    setErrorCode(null)

    async function join() {
      try {
        const res = await fetch(
          `${SYNC}/api/v1/tournament/${tournamentId}/join`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_code: sessionCode,
              player: {
                google_id: session!.user.google_id,
                name: session!.user.name ?? null,
                email: session!.user.email ?? null,
                avatar_url: session!.user.image ?? null,
              },
            }),
          }
        )

        if (cancelled) return

        if (!res.ok) {
          const code: JoinErrorCode =
            res.status === 404 || res.status === 409 || res.status === 410
              ? res.status
              : "network"
          setErrorCode(code)
          setPhase("error")
          return
        }

        const body = await res.json()
        setPlayerId(body.player._id)
        setPhase("leaderboard")
      } catch {
        if (!cancelled) {
          setErrorCode("network")
          setPhase("error")
        }
      }
    }

    join()
    return () => { cancelled = true }
  }, [phase, session, tournamentId, sessionCode, retryKey])

  // ── Leaderboard poll ──────────────────────────────────────────────────────
  const pollLeaderboard = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          `${SYNC}/api/v1/tournament/${tournamentId}/leaderboard?player_id=${id}`
        )
        if (!res.ok) return
        const data: LeaderboardData = await res.json()
        setLeaderboard(data)
        setIsLive(true)
      } catch {
        setIsLive(false)
      }
    },
    [tournamentId]
  )

  useEffect(() => {
    if (phase !== "leaderboard" || !playerId) return

    pollLeaderboard(playerId)
    const interval = setInterval(() => pollLeaderboard(playerId), 5000)
    return () => clearInterval(interval)
  }, [phase, playerId, pollLeaderboard])

  // ── Checking ─────────────────────────────────────────────────────────────
  if (phase === "checking") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-primary animate-spin" aria-hidden />
          <p className="text-sm font-medium text-foreground">Checking session…</p>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            {sessionCode.toUpperCase()}
          </p>
        </div>
      </div>
    )
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (phase === "unauthenticated") {
    const callbackUrl = `/join?t=${encodeURIComponent(tournamentId)}&s=${encodeURIComponent(sessionCode)}`
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 bg-background">
        <div className="flex w-full max-w-[320px] flex-col items-center text-center">
          {/* Session code display */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <QrCode size={30} className="text-primary/50" aria-hidden />
            <span className="font-mono text-[10px] tracking-widest text-foreground/35 uppercase">
              Session Code
            </span>
            <span className="font-mono text-2xl font-bold tracking-[0.15em] text-primary">
              {sessionCode.toUpperCase()}
            </span>
          </div>

          <h1 className="text-xl font-bold text-foreground">Join the tournament</h1>
          <p className="mt-2 mb-8 text-sm leading-relaxed text-muted-foreground">
            Sign in with Google to link your account to this game session.
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  // ── Joining ───────────────────────────────────────────────────────────────
  if (phase === "joining") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-primary animate-spin" aria-hidden />
          <p className="text-sm font-medium text-foreground">Joining tournament…</p>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            {sessionCode.toUpperCase()}
          </p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === "error" && errorCode !== null) {
    const { title, desc } = ERROR_COPY[errorCode]
    return (
      <div className="flex min-h-svh items-center justify-center px-6 bg-background">
        <div className="flex w-full max-w-[320px] flex-col items-center gap-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle size={26} className="text-destructive" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </div>
          {errorCode === "network" && (
            <button
              onClick={() => { setPhase("joining"); setRetryKey((k) => k + 1) }}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────
  const playerInTop10 =
    leaderboard?.player &&
    leaderboard.top10.some((e) => e.rank === leaderboard.player!.rank)

  return (
    <div className="min-h-svh bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[400px] items-center justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Live Leaderboard
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold tracking-[0.1em] text-primary">
              {sessionCode.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <>
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                <span className="font-mono text-[10px] tracking-wider text-primary uppercase">
                  Live
                </span>
              </>
            ) : (
              <>
                <WifiOff size={11} className="text-muted-foreground" aria-hidden />
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Connecting
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mx-auto w-full max-w-[400px] px-4 pt-4 pb-16">
        {!leaderboard ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 size={22} className="animate-spin text-primary" aria-hidden />
            <p className="text-xs text-muted-foreground">Loading leaderboard…</p>
          </div>
        ) : (
          <>
            {/* Top 10 */}
            <div className="space-y-2">
              {leaderboard.top10.map((entry) => {
                const isMe =
                  leaderboard.player !== undefined &&
                  entry.rank === leaderboard.player.rank

                return (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                      isMe
                        ? "border-primary/30 bg-primary/10"
                        : "border-border bg-card"
                    }`}
                  >
                    {/* Rank badge */}
                    <div
                      className={`w-7 shrink-0 text-center font-mono text-sm font-bold ${
                        entry.rank === 1
                          ? "text-yellow-500"
                          : entry.rank === 2
                          ? "text-slate-400"
                          : entry.rank === 3
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {entry.rank <= 3 ? (
                        <Medal size={15} className="mx-auto" aria-hidden />
                      ) : (
                        `#${entry.rank}`
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                      <Avatar src={entry.player.avatar_url} name={entry.player.name} />
                    </div>

                    {/* Name */}
                    <p
                      className={`flex-1 truncate text-sm font-semibold ${
                        isMe ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {entry.player.name}
                      {isMe && (
                        <span className="ml-1.5 font-mono text-[10px] text-primary/60">
                          (you)
                        </span>
                      )}
                    </p>

                    {/* Score */}
                    <p className="font-mono text-sm font-bold tabular-nums text-foreground">
                      {entry.score.toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Player row when outside top 10 */}
            {leaderboard.player && !playerInTop10 && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                  <div className="w-7 shrink-0 text-center font-mono text-sm font-bold text-primary">
                    #{leaderboard.player.rank}
                  </div>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Trophy size={14} className="text-primary" aria-hidden />
                  </div>
                  <p className="flex-1 text-sm font-semibold text-primary">You</p>
                  <p className="font-mono text-sm font-bold tabular-nums text-foreground">
                    {leaderboard.player.score.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
