"use client"

import { useState, useEffect, useCallback } from "react"
import { Gamepad2, Loader2, Trophy } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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
  center_name?: string | null
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
  const [tab, setTab] = useState<"leaderboard" | "plays" | "rewards">("leaderboard")
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
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
    } catch {
      // Ignore error
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

      {/* ── Header Section ── */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 pt-4 pb-2 text-left">
        <div className="text-xs sm:text-sm text-zinc-500 font-mono uppercase tracking-wider flex items-center justify-between gap-2 flex-wrap w-full">
          <span>
            Tournament: <span className="font-bold text-zinc-800">{tournament?.name || `Tournament_${tournamentId.substring(0, 6)}`}</span>
          </span>
          {tournament?.status === "active" && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-50 border border-red-200/50 text-red-600 font-mono font-bold uppercase tracking-wider shadow-xs">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              Active
            </span>
          )}
        </div>
      </section>

      {/* ── Content ── */}
      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pt-4 pb-16 flex-grow">

        {/* ── Available Rewards Section ── */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-indigo-400 bg-indigo-50/90 p-4 sm:p-6 min-h-[220px] shadow-[0_4px_20px_rgba(99,102,241,0.08)] w-full mb-6">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-indigo-200/30">
              <span className="font-sans text-xs sm:text-sm font-black tracking-wide sm:tracking-[0.1em] text-indigo-700 uppercase truncate">
                Available Rewards
              </span>
              <span className="font-mono text-[10px] sm:text-xs text-indigo-500 font-bold uppercase tracking-wider">
                Prizes
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-md">
                <Gift size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-zinc-800 transition-colors duration-300">
                  Tournament Prizes
                </h3>

                <div className="mt-3.5 space-y-3.5">
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center pt-1.5">
                    {/* 2nd Place */}
                    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white/60 p-2.5 sm:p-3.5 shadow-xs">
                      <span className="font-mono text-[9px] font-black text-zinc-500 uppercase tracking-wider">2nd Place</span>
                      <p className="mt-1.5 font-sans text-xs sm:text-sm font-black text-zinc-900 leading-none">₹2,500</p>
                      <span className="mt-1 font-mono text-[8px] font-bold text-zinc-450 uppercase">Cash</span>
                    </div>

                    {/* 1st Place - Champion */}
                    <div className="flex flex-col justify-between rounded-xl border-2 border-amber-300 bg-amber-50/40 p-3.5 shadow-md relative -translate-y-1">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-amber-500 text-white font-mono text-[7px] font-black uppercase tracking-wider shadow-xs leading-none">
                        CHAMP
                      </div>
                      <span className="font-mono text-[9px] font-black text-amber-700 uppercase tracking-wider mt-1">1st Place</span>
                      <p className="mt-1.5 font-sans text-sm sm:text-base font-black text-amber-900 leading-none">₹5,000</p>
                      <span className="mt-1 font-mono text-[8px] font-bold text-amber-600 uppercase">Cash</span>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white/60 p-2.5 sm:p-3.5 shadow-xs">
                      <span className="font-mono text-[9px] font-black text-zinc-500 uppercase tracking-wider">3rd Place</span>
                      <p className="mt-1.5 font-sans text-xs sm:text-sm font-black text-zinc-900 leading-none">₹500</p>
                      <span className="mt-1 font-mono text-[8px] font-bold text-zinc-450 uppercase">Cash</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar (Separated from Navbar) */}
        <div className="flex border-b border-zinc-200/80 mb-5 items-center justify-between">
          <div className="flex gap-4">
            {(["leaderboard", "plays", "rewards"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2.5 font-sans text-sm sm:text-base font-black tracking-wide uppercase transition-all border-b-2 cursor-pointer ${tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t === "leaderboard" ? "Leaderboard" : t === "plays" ? "My Plays" : "My Rewards"}
              </button>
            ))}
          </div>
        </div>

        {tab === "leaderboard" && (
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
                  const top10 = leaderboard.leaderboard.slice(0, 10)
                  const isPlayerInTop10 = leaderboard.player != null && top10.some((e) => e.rank === leaderboard.player!.rank)

                  const displayedEntries = [...top10]
                  if (leaderboard.player && !isPlayerInTop10) {
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

                    let cardClass = "border-zinc-300 bg-zinc-100/45 hover:bg-zinc-100/60 shadow-[0_4px_12px_rgba(113,113,122,0.06)]"
                    let rankWidget = null
                    let scoreColor = "text-zinc-600 font-extrabold"

                    if (isRank1) {
                      cardClass = "border-orange-400 bg-orange-100/45 hover:bg-orange-100/60 shadow-[0_4px_16px_rgba(249,115,22,0.16)] border-l-4 border-l-orange-500"
                      rankWidget = (
                        <div className="text-xl shrink-0 w-8 sm:w-10 text-left select-none">
                          🥇
                        </div>
                      )
                      scoreColor = "text-orange-700 font-extrabold"
                    } else if (isRank2) {
                      cardClass = "border-sky-400 bg-sky-100/45 hover:bg-sky-100/60 shadow-[0_4px_12px_rgba(56,189,248,0.12)]"
                      rankWidget = (
                        <div className="text-xl shrink-0 w-8 sm:w-10 text-left select-none">
                          🥈
                        </div>
                      )
                      scoreColor = "text-sky-700 font-extrabold"
                    } else if (isRank3) {
                      cardClass = "border-indigo-400 bg-indigo-100/45 hover:bg-indigo-100/60 shadow-[0_4px_12px_rgba(99,102,241,0.12)]"
                      rankWidget = (
                        <div className="text-xl shrink-0 w-8 sm:w-10 text-left select-none">
                          🥉
                        </div>
                      )
                      scoreColor = "text-indigo-700 font-extrabold"
                    } else {
                      rankWidget = (
                        <div className={`font-mono text-sm sm:text-base font-black shrink-0 w-8 sm:w-10 text-left pl-1.5 ${isMe ? "text-orange-700" : "text-zinc-500"
                          }`}>
                          {entry.rank}
                        </div>
                      )
                      scoreColor = "text-zinc-600 font-extrabold"
                    }

                    if (isMe) {
                      if (!isRank1 && !isRank2 && !isRank3) {
                        cardClass = "border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 border-2 shadow-[0_4px_16px_rgba(16,185,129,0.12)]"
                      } else {
                        cardClass = `${cardClass} border-emerald-500 border-2 shadow-[0_4px_16px_rgba(16,185,129,0.16)]`
                      }
                    }

                    return (
                      <div
                        key={entry.rank}
                        className={`relative flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-all duration-200 ${cardClass}`}
                      >
                        {isMe && (
                          <span className="absolute -top-2.5 left-14 px-2 py-0.5 rounded bg-emerald-500 text-white font-mono text-[9px] font-black uppercase tracking-wider shadow-sm z-10 leading-none">
                            YOU
                          </span>
                        )}
                        {/* Rank Widget */}
                        {rankWidget}

                        {/* Avatar */}
                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-zinc-200 border border-zinc-300/60 shadow-sm relative">
                          {isMe && (
                            <span className="absolute inset-0 rounded-full border-2 border-emerald-500/80 animate-pulse pointer-events-none" />
                          )}
                          <Avatar
                            src={entry.players[0]?.avatar_url ?? ""}
                            name={entry.center?.name || entry.players.map(p => p?.name).filter(Boolean).join(", ") || "?"}
                          />
                        </div>

                        {/* Name */}
                        <p
                          className={`flex items-center flex-1 truncate text-xs sm:text-sm md:text-base font-bold ${isMe ? "text-emerald-950" : "text-zinc-900"
                            }`}
                        >
                          <span className="truncate">
                            {entry.center?.name || entry.players.map(p => p?.name).filter(Boolean).join(", ") || "Unknown"}
                          </span>
                          {isRank1 && (
                            <Crown size={13} className="fill-orange-500 text-orange-600 shrink-0 ml-1.5 align-middle mb-0.5" />
                          )}
                        </p>

                        {/* Score */}
                        <p className={`font-mono text-xs sm:text-sm md:text-base font-bold tabular-nums ${scoreColor} leading-none flex items-center gap-1.5`}>
                          {isRank1 && <Trophy size={14} className="fill-amber-400 text-amber-500 shrink-0 mb-0.5" />}
                          {isRank2 && <Trophy size={14} className="fill-slate-300 text-slate-400 shrink-0 mb-0.5" />}
                          {isRank3 && <Trophy size={14} className="fill-orange-400 text-orange-500 shrink-0 mb-0.5" />}
                          {entry.score.toLocaleString()}
                        </p>
                      </div>
                    )
                  })
                })()}
              </div>

            </>
          )
        )}

        {tab === "plays" && (
          // ── My Plays tab ─────────────────────────────────────────────────
          !playsLoaded ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 size={22} className="animate-spin text-primary" aria-hidden />
              <p className="text-xs text-muted-foreground">Loading plays…</p>
            </div>
          ) : plays && plays.length > 0 ? (
            <div className="space-y-2.5">
              {(() => {
                const playerRank = leaderboard?.player?.rank
                const userTopEntry = leaderboard?.leaderboard.find((e) =>
                  e.players.some((p) => p.name === name)
                )
                const finalRank = playerRank || userTopEntry?.rank
                const maxScore = plays && plays.length > 0 ? Math.max(...plays.map((p) => p.score)) : 0
                const bestPlayIndex = plays.findIndex((p) => p.score === maxScore)

                return plays.map((g, index) => {
                  const isBestPlay = bestPlayIndex !== -1 && index === bestPlayIndex

                  let cardClass = "border-zinc-200 bg-white/70 hover:bg-white/95 hover:border-zinc-300 shadow-sm"
                  let iconBg = "bg-zinc-100 text-zinc-500 border border-zinc-200/50"
                  let iconElement = <Gamepad2 size={16} />
                  let bestPlayBadge = null

                  if (isBestPlay) {
                    if (finalRank === 1) {
                      cardClass = "border-orange-400 bg-orange-50/50 hover:bg-orange-50/70 shadow-md shadow-orange-500/8 border-l-4 border-l-orange-500"
                      iconBg = "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm"
                      iconElement = <Crown size={16} />
                      bestPlayBadge = (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 shadow-xs">
                          👑 Personal Best
                        </span>
                      )
                    } else if (finalRank === 2) {
                      cardClass = "border-sky-400 bg-sky-50/50 hover:bg-sky-50/70 shadow-md shadow-sky-500/8 border-l-4 border-l-sky-500"
                      iconBg = "bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-sm"
                      iconElement = <Trophy size={16} />
                      bestPlayBadge = (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 shadow-xs">
                          🏆 Personal Best
                        </span>
                      )
                    } else if (finalRank === 3) {
                      cardClass = "border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50/70 shadow-md shadow-indigo-500/8 border-l-4 border-l-indigo-500"
                      iconBg = "bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-sm"
                      iconElement = <Trophy size={16} />
                      bestPlayBadge = (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs">
                          🏆 Personal Best
                        </span>
                      )
                    } else {
                      cardClass = "border-amber-400 bg-amber-50/50 hover:bg-amber-50/70 shadow-md shadow-amber-500/8 border-l-4 border-l-amber-500"
                      iconBg = "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm"
                      iconElement = <Trophy size={16} />
                      bestPlayBadge = (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shadow-xs">
                          🏆 Personal Best
                        </span>
                      )
                    }
                  }

                  return (
                    <div
                      key={`${g.gameplay_id}-${index}`}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 ${cardClass}`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Status Icon Indicator */}
                        <div className={`flex size-9.5 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${iconBg}`}>
                          {iconElement}
                        </div>

                        {/* Date/Time info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap text-left">
                            <p className="font-mono text-sm sm:text-base font-extrabold text-zinc-800 leading-none">
                              {new Date(g.played_at).toLocaleDateString(undefined, {
                                month: "short", day: "numeric", year: "numeric",
                              })}
                            </p>
                            {bestPlayBadge}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <p className="font-mono text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-wider leading-none">
                              {new Date(g.played_at).toLocaleTimeString(undefined, {
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                            {g.center_name && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-150 border border-zinc-200/50 font-mono text-[8px] sm:text-[9px] font-bold text-zinc-600 uppercase tracking-wider leading-none shadow-3xs">
                                {g.center_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score display */}
                      <div className="text-right shrink-0 pl-3">
                        <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest leading-none mb-1 font-bold">
                          Score
                        </p>
                        <p className="font-mono text-base sm:text-lg md:text-xl font-black tabular-nums text-zinc-950 leading-none">
                          {g.score.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              })()}
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

        {tab === "rewards" && (() => {
          const userTopEntry = leaderboard?.leaderboard.find((e) =>
            e.players.some((p) => p.name === name)
          )
          const finalRank = pid ? leaderboard?.player?.rank : userTopEntry?.rank

          const hasWon = finalRank !== undefined && finalRank >= 1 && finalRank <= 3
          let prizeAmount = ""
          let medalEmoji = ""
          let gradientBg = ""
          let borderColor = ""
          let rankTitle = ""

          if (finalRank === 1) {
            prizeAmount = "₹5,000"
            medalEmoji = "🥇"
            gradientBg = "from-amber-500/15 via-orange-500/5 to-transparent"
            borderColor = "border-amber-400/80 shadow-md shadow-amber-500/5"
            rankTitle = "Tournament Champion"
          } else if (finalRank === 2) {
            prizeAmount = "₹2,500"
            medalEmoji = "🥈"
            gradientBg = "from-slate-400/15 via-sky-500/5 to-transparent"
            borderColor = "border-slate-300/80 shadow-md shadow-sky-500/5"
            rankTitle = "Runner-Up Prize"
          } else if (finalRank === 3) {
            prizeAmount = "₹500"
            medalEmoji = "🥉"
            gradientBg = "from-amber-700/15 via-indigo-500/5 to-transparent"
            borderColor = "border-amber-600/60 shadow-md shadow-indigo-500/5"
            rankTitle = "Third Place Prize"
          }

          return (
            <div className="space-y-2.5 select-none animate-none">
              {hasWon ? (
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border p-4 sm:px-4 sm:py-3.5 transition-all duration-300 hover:-translate-y-0.5 bg-white/70 backdrop-blur-md ${borderColor} gap-4`}>
                  
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Left: Medal Emoji */}
                    <div className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-2xs text-lg select-none">
                      {medalEmoji}
                    </div>

                    {/* Middle: Reward Description */}
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap text-left">
                        <p className="font-sans text-base sm:text-lg md:text-xl font-black text-black leading-tight">
                          Rank {finalRank} • {rankTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <p className="font-mono text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-wider leading-none">
                          {tournament?.name || "EPIC Tournament"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Divider for mobile screen only */}
                  <div className="block sm:hidden h-px bg-zinc-200/60 w-full" />

                  {/* Right: Prize display & Claim Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pl-0 sm:pl-3">
                    <div className="text-left sm:text-right">
                      <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest leading-none mb-1 font-bold">
                        Prize
                      </p>
                      <p className="font-mono text-base sm:text-lg md:text-xl font-black tabular-nums text-zinc-950 leading-none">
                        {prizeAmount}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <button className="py-1.5 px-3 rounded-lg font-sans text-[9px] font-black uppercase tracking-wider bg-zinc-950 text-white shadow-2xs hover:bg-zinc-900 transition-all duration-200 active:scale-98 cursor-pointer leading-none">
                        Claim
                      </button>
                      <span className="font-mono text-[7px] text-orange-600 font-bold uppercase tracking-wider whitespace-nowrap">
                        Pending Lock
                      </span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-200 bg-white/70 backdrop-blur-md px-4 py-3.5 flex items-center justify-between gap-4 text-left shadow-xs transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 shadow-2xs">
                      <Trophy size={16} className="text-zinc-400 fill-zinc-50" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-mono text-sm sm:text-base font-extrabold text-zinc-800 leading-none">
                        No rewards won yet
                      </h3>
                      <p className="mt-1.5 font-mono text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-wider leading-none">
                        Rank {finalRank != null ? `#${finalRank}` : "unranked"}. Reach the top 3 spots to win cash!
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTab("leaderboard")}
                    className="shrink-0 py-1.5 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 active:scale-98 shadow-2xs text-[9px] font-bold text-zinc-700 uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Leaderboard
                  </button>
                </div>
              )}
            </div>
          )
        })()}

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
