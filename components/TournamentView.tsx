"use client"

import { useState, useEffect, useCallback } from "react"
import { Medal, Trophy, WifiOff, Gamepad2, Loader2 } from "lucide-react"
import Image from "next/image"
import type { LeaderboardData } from "@/types"
import { Navbar } from "./Navbar"
import { getUrlForEnv } from "@/lib/sync-env"
import { BackButton } from "./BackButton"

// ── Constants ─────────────────────────────────────────────────────────────────

const SYNC = process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? ""

// ── Types ─────────────────────────────────────────────────────────────────────

interface Gameplay {
  gameplay_id: string
  tournament_id: string
  score: number
  played_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 32 }: { src: string; name: string; size?: number }) {
  if (src) {
    return <Image src={src} alt="" width={size} height={size} className="size-full object-cover" />
  }
  return (
    <span className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  tournamentId: string
  googleId: string
  env: string
  pid?: string
  name?: string | null
  image?: string | null
}

export function TournamentView({ tournamentId, googleId, env, pid, name, image }: Props) {
  const [tab, setTab] = useState<"leaderboard" | "plays">("leaderboard")
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [plays, setPlays] = useState<Gameplay[] | null>(null)
  const [playsLoaded, setPlaysLoaded] = useState(false)

  // ── Leaderboard polling ────────────────────────────────────────────────────
  const pollLeaderboard = useCallback(async () => {
    try {
      const url = pid
        ? getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard/player/${pid}`, env)
        : getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard?page=1&limit=10`, env)
      const res = await fetch(url)
      if (!res.ok) return
      const data: LeaderboardData = await res.json()
      setLeaderboard(data)
      setIsLive(true)
    } catch {
      setIsLive(false)
    }
  }, [tournamentId, pid, env])

  useEffect(() => {
    pollLeaderboard()
    const interval = setInterval(pollLeaderboard, 5000)
    return () => clearInterval(interval)
  }, [pollLeaderboard])

  // ── My Plays lazy fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "plays" || playsLoaded) return

    async function fetchPlays() {
      try {
        const res = await fetch(
          getUrlForEnv(`${SYNC}/api/v1/player/${googleId}/gameplays?tournament_id=${tournamentId}&limit=50`, env)
        )
        if (!res.ok) { setPlays([]); return }
        const data = await res.json()
        setPlays(data.gameplays ?? [])
      } catch {
        setPlays([])
      } finally {
        setPlaysLoaded(true)
      }
    }

    fetchPlays()
  }, [tab, playsLoaded, googleId, env, tournamentId])

  const playerInTop10 =
    leaderboard?.player != null &&
    leaderboard.leaderboard.some((e) => e.rank === leaderboard.player!.rank)

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 text-zinc-900 relative overflow-hidden select-none">

      {/* Page-wide subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Hero radial backlight glow - orange branded warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] rounded-full bg-gradient-to-b from-orange-200/20 via-zinc-300/30 to-transparent blur-[120px]"
      />

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-xl shadow-sm transition-all">
        <Navbar name={name} image={image} />

        {/* Tab bar */}
        <div className="mx-auto flex max-w-[400px] md:max-w-2xl items-center px-4">
          {(["leaderboard", "plays"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 font-mono text-xs font-bold tracking-wider uppercase transition-colors border-b-2 ${tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {t === "leaderboard" ? "Leaderboard" : "My Plays"}
            </button>
          ))}
          <div className="flex items-center gap-1.5 pb-2.5 pl-3 shrink-0">
            {isLive ? (
              <>
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                <span className="font-mono text-[9px] tracking-wider text-primary uppercase">Live</span>
              </>
            ) : (
              <>
                <WifiOff size={10} className="text-muted-foreground" aria-hidden />
                <span className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">—</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Back Navigation Wrapper (Aligns with max-w-7xl navbar on desktop) ── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-6 flex justify-start">
        <BackButton />
      </div>

      {/* ── Content ── */}
      <main className="relative z-10 mx-auto w-full max-w-[400px] md:max-w-2xl px-4 pt-4 pb-16 flex-grow">

        {tab === "leaderboard" ? (
          // ── Leaderboard tab ──────────────────────────────────────────────
          !leaderboard ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 size={22} className="animate-spin text-primary" aria-hidden />
              <p className="text-xs text-muted-foreground">Loading leaderboard…</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {leaderboard.leaderboard.map((entry) => {
                  const isMe =
                    leaderboard.player != null && entry.rank === leaderboard.player.rank

                  return (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isMe ? "border-primary/30 bg-primary/10" : "border-border bg-card"
                        }`}
                    >
                      {/* Rank badge */}
                      <div
                        className={`w-7 shrink-0 text-center font-mono text-sm font-bold ${entry.rank === 1
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
                        <Avatar
                          src={entry.players[0]?.avatar_url ?? ""}
                          name={entry.players[0]?.name ?? "?"}
                        />
                      </div>

                      {/* Name */}
                      <p
                        className={`flex-1 truncate text-sm font-semibold ${isMe ? "text-primary" : "text-foreground"
                          }`}
                      >
                        {entry.players[0]?.name ?? "Unknown"}
                        {isMe && (
                          <span className="ml-1.5 font-mono text-[10px] text-primary/60">(you)</span>
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
                      {leaderboard.player.best_score.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          // ── My Plays tab ─────────────────────────────────────────────────
          !playsLoaded ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 size={22} className="animate-spin text-primary" aria-hidden />
              <p className="text-xs text-muted-foreground">Loading plays…</p>
            </div>
          ) : plays && plays.length > 0 ? (
            <div className="space-y-2">
              {plays.map((g) => (
                <div
                  key={g.gameplay_id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-bold text-foreground">
                      {new Date(g.played_at).toLocaleDateString(undefined, {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {new Date(g.played_at).toLocaleTimeString(undefined, {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-bold tabular-nums text-foreground">
                    {g.score.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <Gamepad2 size={26} className="text-primary" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">No plays yet</p>
                <p className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-muted-foreground">
                  Your scores for this tournament will appear here after you play.
                </p>
              </div>
            </div>
          )
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-zinc-200 py-4 text-center bg-zinc-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center font-mono text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide sm:tracking-widest text-center">
          <span>© {new Date().getFullYear()} FOG Technologies Pvt. Limited</span>
        </div>
      </footer>

    </div>
  )
}
