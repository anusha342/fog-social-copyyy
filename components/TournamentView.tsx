"use client"

import { useState, useEffect, useCallback } from "react"
import { Medal, Trophy, WifiOff, Gamepad2, Loader2, Calendar, ChevronRight, Crown } from "lucide-react"
import Image from "next/image"
import type { LeaderboardData, Tournament } from "@/types"
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
  const [tournament, setTournament] = useState<Tournament | null>(null)

  const startDateStr = tournament?.started_at
    ? new Date(tournament.started_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : ""

  const endDateStr = tournament?.ended_at
    ? new Date(tournament.ended_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : tournament?.status === "active"
      ? "Active"
      : "—"

  // ── Fetch single tournament details ────────────────────────────────────────
  useEffect(() => {
    async function getTournamentDetails() {
      try {
        const url = getUrlForEnv(`${SYNC}/api/v1/tournaments?limit=50`, env)
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        const found = data.tournaments?.find((t: any) => t._id === tournamentId)
        if (found) {
          setTournament(found)
        }
      } catch (err) {
        console.error("Error fetching tournament details", err)
      }
    }
    getTournamentDetails()
  }, [tournamentId, env])

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
    <div className="min-h-screen flex flex-col bg-transparent text-zinc-900 relative overflow-hidden select-none">

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
      <header className="sticky top-0 z-50 border-b border-zinc-200/40 bg-white/80 backdrop-blur-xl shadow-sm transition-all">
        <Navbar name={name} image={image} />
      </header>

      {/* ── Back Navigation Wrapper (Sticky below Navbar) ── */}
      <div className="sticky top-[56px] z-30 bg-transparent py-3 mb-2">
        <div className="mx-auto w-full max-w-7xl px-4 flex justify-start">
          <BackButton />
        </div>
      </div>

      {/* ── Hero Tournament Info Section ── */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 pt-4 pb-2">
        <div className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-4 mb-2 w-full">
            <h1 className="text-lg min-[390px]:text-xl sm:text-2xl font-black tracking-tight text-zinc-900 uppercase font-sans leading-none">
              {tournament?.name || `Tournament_${tournamentId.substring(0, 6)}`}
            </h1>
            {tournament?.status === "active" ? (
              <span className="flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 border border-red-200/50 text-red-600 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                <span className="size-1 animate-pulse rounded-full bg-red-500" />
                Live
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200/40 text-zinc-500 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                Completed
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 border-t border-zinc-200/60 pt-3 text-[10px] sm:text-xs font-mono text-zinc-500 uppercase">
            {startDateStr && (
              <span className="flex items-center gap-1">
                Started: <span className="font-bold text-zinc-700">{startDateStr}</span>
              </span>
            )}
            {tournament?.player_count !== undefined && (
              <span className="flex items-center gap-1">
                Players: <span className="font-bold text-zinc-700">{tournament.player_count}</span>
              </span>
            )}
            {tournament?.top_score !== undefined && (
              <span className="flex items-center gap-1">
                Top Score: <span className="font-bold text-primary">{tournament.top_score.toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pt-4 pb-16 flex-grow">

        {/* Tab bar (Separated from Navbar) */}
        <div className="flex border-b border-zinc-200/80 mb-5 items-center justify-between">
          <div className="flex gap-4">
            {(["leaderboard", "plays"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2.5 font-sans text-sm sm:text-base font-black tracking-wide uppercase transition-all border-b-2 cursor-pointer ${tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t === "leaderboard" ? "Leaderboard" : "My Plays"}
              </button>
            ))}
          </div>
        </div>

        {tab === "leaderboard" ? (
          // ── Leaderboard tab ──────────────────────────────────────────────
          !leaderboard ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 size={22} className="animate-spin text-primary" aria-hidden />
              <p className="text-xs text-muted-foreground">Loading leaderboard…</p>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {(() => {
                  const top5 = leaderboard.leaderboard.slice(0, 5)
                  const isPlayerInTop5 = leaderboard.player != null && top5.some((e) => e.rank === leaderboard.player!.rank)

                  const displayedEntries = [...top5]
                  if (leaderboard.player && !isPlayerInTop5) {
                    displayedEntries.push({
                      rank: leaderboard.player.rank,
                      score: leaderboard.player.best_score,
                      played_at: "",
                      players: [
                        {
                          name: name ?? "You",
                          avatar_url: image ?? "",
                        },
                      ],
                    })
                  }

                  return displayedEntries.map((entry) => {
                    const isMe =
                      leaderboard.player != null && entry.rank === leaderboard.player.rank

                    const isRank1 = entry.rank === 1
                    const isRank2 = entry.rank === 2
                    const isRank3 = entry.rank === 3

                    let cardClass = "border-pink-400/80 bg-pink-100/45 hover:bg-pink-100/60 shadow-[0_4px_12px_rgba(244,63,94,0.1)]"
                    let rankWidget = null
                    let scoreColor = "text-zinc-900"

                    if (isRank1) {
                      cardClass = "border-amber-400 bg-amber-100/45 hover:bg-amber-100/60 shadow-[0_4px_16px_rgba(245,158,11,0.16)] border-l-4 border-l-amber-500"
                      rankWidget = (
                        <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                          #1
                        </div>
                      )
                      scoreColor = "text-amber-750 font-extrabold"
                    } else if (isRank2) {
                      cardClass = "border-indigo-400 bg-indigo-100/45 hover:bg-indigo-100/60 shadow-[0_4px_12px_rgba(99,102,241,0.12)]"
                      rankWidget = (
                        <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200">
                          #2
                        </div>
                      )
                      scoreColor = "text-indigo-700 font-extrabold"
                    } else if (isRank3) {
                      cardClass = "border-orange-400/80 bg-orange-100/35 hover:bg-orange-100/50 shadow-[0_4px_12px_rgba(249,115,22,0.1)]"
                      rankWidget = (
                        <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-orange-100 text-amber-800 border border-amber-600/20">
                          #3
                        </div>
                      )
                      scoreColor = "text-amber-800 font-extrabold"
                    } else if (entry.rank === 4) {
                      cardClass = "border-cyan-400/80 bg-cyan-100/45 hover:bg-cyan-100/60 shadow-[0_4px_12px_rgba(6,182,212,0.1)]"
                      rankWidget = (
                        <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-cyan-100 text-cyan-700 border border-cyan-200">
                          #4
                        </div>
                      )
                      scoreColor = "text-cyan-700 font-extrabold"
                    } else if (entry.rank === 5) {
                      cardClass = "border-emerald-400/80 bg-emerald-100/45 hover:bg-emerald-100/60 shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
                      rankWidget = (
                        <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                          #5
                        </div>
                      )
                      scoreColor = "text-emerald-700 font-extrabold"
                    } else {
                      rankWidget = (
                        <div className={`flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg border ${isMe
                          ? "text-orange-700 bg-orange-100 border-orange-200"
                          : "text-pink-700 bg-pink-100 border-pink-200"
                          }`}>
                          #{entry.rank}
                        </div>
                      )
                      scoreColor = "text-pink-700 font-extrabold"
                    }

                    if (isMe) {
                      cardClass = `${cardClass} border-l-4 border-l-orange-500`
                      if (!isRank1 && !isRank2 && !isRank3) {
                        cardClass = `${cardClass} border-r-orange-400/80 border-t-orange-400/80 border-b-orange-400/80 bg-orange-100/45 hover:bg-orange-100/60 shadow-[0_4px_16px_rgba(249,115,22,0.16)]`
                      } else {
                        cardClass = `${cardClass} shadow-md shadow-orange-500/8`
                      }
                    }

                    return (
                      <div
                        key={entry.rank}
                        className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-all duration-200 ${cardClass}`}
                      >
                        {/* Rank Widget */}
                        {rankWidget}

                        {/* Avatar */}
                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-zinc-200 border border-zinc-300/60 shadow-sm relative">
                          {isMe && (
                            <span className="absolute inset-0 rounded-full border-2 border-orange-500/80 animate-pulse pointer-events-none" />
                          )}
                          <Avatar
                            src={entry.players[0]?.avatar_url ?? ""}
                            name={entry.players[0]?.name ?? "?"}
                          />
                        </div>

                        {/* Name */}
                        <p
                          className={`flex items-center flex-1 truncate text-xs sm:text-sm md:text-base font-bold ${isMe ? "text-orange-950" : "text-zinc-900"
                            }`}
                        >
                          <span className="truncate">{entry.players[0]?.name ?? "Unknown"}</span>
                          {isRank1 && (
                            <Crown size={13} className="fill-amber-500 text-amber-600 shrink-0 ml-1.5 align-middle mb-0.5" />
                          )}
                          {isMe && (
                            <span className="ml-1.5 font-mono text-[9px] font-black uppercase text-orange-600 bg-orange-100/60 border border-orange-200/50 px-1.5 py-0.5 rounded tracking-wider shadow-sm animate-pulse">YOU</span>
                          )}
                        </p>

                        {/* Score */}
                        <p className={`font-mono text-xs sm:text-sm md:text-base font-bold tabular-nums ${scoreColor} leading-none`}>
                          {entry.score.toLocaleString()}
                        </p>
                      </div>
                    )
                  })
                })()}
              </div>

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
            <div className="space-y-2.5">
              {plays.map((g) => (
                <div
                  key={g.gameplay_id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white/65 hover:bg-white/90 shadow-sm px-4 py-3.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 rounded-lg text-zinc-400 border border-zinc-200/40">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold text-zinc-700">
                        {new Date(g.played_at).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-zinc-400 font-medium">
                        {new Date(g.played_at).toLocaleTimeString(undefined, {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-sm sm:text-base font-extrabold tabular-nums text-zinc-900">
                    {g.score.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 text-center select-none">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-100/50 border border-orange-200/30 shadow-sm">
                <Gamepad2 size={26} className="text-primary animate-pulse" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800">No plays yet</p>
                <p className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-muted-foreground mx-auto">
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
