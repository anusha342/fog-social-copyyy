"use client"

import { useState, useEffect, useCallback } from "react"
import { Gamepad2, Loader2, Calendar, Crown, Gift, ChevronRight } from "lucide-react"
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

      {/* ── Welcome Header Section ── */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 pt-4 pb-2">
        {name ? (
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 uppercase font-sans">
              Welcome Back, {name.split(" ")[0]}!
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-mono uppercase tracking-wider">
              Tournament: <span className="font-bold text-zinc-800">{tournament?.name || `Tournament_${tournamentId.substring(0, 6)}`}</span>
              {tournament?.status === "active" && (
                <span className="ml-2 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-red-50 border border-red-200/50 text-red-600 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                  <span className="size-1 rounded-full bg-red-500 animate-pulse" />
                  Active
                </span>
              )}
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 uppercase font-sans">
              {tournament?.name || `Tournament_${tournamentId.substring(0, 6)}`}
            </h1>
            {tournament?.status === "active" && (
              <span className="mt-1 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-red-50 border border-red-200/50 text-red-600 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                <span className="size-1 rounded-full bg-red-500 animate-pulse" />
                Active
              </span>
            )}
          </div>
        )}
      </section>

      {/* ── Available Rewards Section ── */}
      {tournament?.rewards && (tournament.rewards.bannerUrl || tournament.rewards.top3Urls?.first || tournament.rewards.top3Urls?.second || tournament.rewards.top3Urls?.third) && tournament.rewards.showOnPlayerPage !== false && (
        <section className="relative z-10 mx-auto w-full max-w-4xl px-4 py-2">
          {/* ── Rewards Display Panel ── */}
          <div className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Gift className="text-primary size-5" />
                <h2 className="text-sm min-[390px]:text-base font-black tracking-tight text-zinc-950 uppercase font-sans">
                  Available Rewards
                </h2>
              </div>
            </div>

            {tournament.rewards.type === "banner" ? (
              /* Banner Display State */
              <div className="group relative w-full h-[180px] min-[390px]:h-[220px] rounded-xl overflow-hidden shadow-inner border border-zinc-100 bg-zinc-950">
                <Image
                  src={tournament.rewards.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800"}
                  alt="Tournament Rewards Banner"
                  fill
                  sizes="(max-w-4xl) 100vw, 800px"
                  priority
                  className="object-cover opacity-80 group-hover:scale-105 transition duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4">
                  <span className="w-fit px-1.5 py-0.5 rounded bg-orange-500/90 text-white font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1.5 shadow-sm">
                    Grand Prize Reward
                  </span>
                  <h3 className="text-white text-xs min-[390px]:text-sm sm:text-base font-bold uppercase tracking-tight leading-normal drop-shadow-md">
                    Claim your rewards by reaching the top ranks!
                  </h3>
                </div>
              </div>
            ) : (
              /* Top 3 Podium Display State */
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {/* 2nd Place Prize */}
                  {tournament.rewards.top3Urls?.second && (
                    <div className="flex flex-col items-center border border-zinc-200/80 bg-zinc-50/50 rounded-xl p-3 shadow-sm hover:border-zinc-300 transition duration-300">
                      <div className="relative w-full aspect-square max-h-[80px] rounded-lg overflow-hidden bg-white border border-zinc-150 mb-2.5">
                        <Image
                          src={tournament.rewards.top3Urls.second}
                          alt="2nd Place Prize"
                          fill
                          sizes="150px"
                          className="object-contain p-1"
                        />
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-[8px] font-black uppercase tracking-wider mb-1">
                        #2 Prize
                      </span>
                      <span className="text-[10px] font-black text-zinc-950 uppercase tracking-tight text-center truncate w-full">
                        Runner Up
                      </span>
                    </div>
                  )}

                  {/* 1st Place Prize */}
                  {tournament.rewards.top3Urls?.first && (
                    <div className="flex flex-col items-center border-2 border-amber-300 bg-amber-50/20 rounded-xl p-3 shadow-[0_4px_12px_rgba(245,158,11,0.06)] hover:border-amber-400 transition duration-300 relative -translate-y-1">
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center bg-amber-500 text-white font-mono text-[7px] min-[390px]:text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Champion
                      </div>
                      <div className="relative w-full aspect-square max-h-[90px] rounded-lg overflow-hidden bg-white border border-amber-100 mt-1 mb-2.5">
                        <Image
                          src={tournament.rewards.top3Urls.first}
                          alt="1st Place Prize"
                          fill
                          sizes="150px"
                          className="object-contain p-1"
                        />
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-amber-150 text-amber-800 font-mono text-[8px] font-black uppercase tracking-wider mb-1">
                        #1 Prize
                      </span>
                      <span className="text-[10px] font-black text-amber-950 uppercase tracking-tight text-center truncate w-full">
                        Grand Champion
                      </span>
                    </div>
                  )}

                  {/* 3rd Place Prize */}
                  {tournament.rewards.top3Urls?.third && (
                    <div className="flex flex-col items-center border border-zinc-200/80 bg-zinc-50/50 rounded-xl p-3 shadow-sm hover:border-zinc-300 transition duration-300">
                      <div className="relative w-full aspect-square max-h-[80px] rounded-lg overflow-hidden bg-white border border-zinc-150 mb-2.5">
                        <Image
                          src={tournament.rewards.top3Urls.third}
                          alt="3rd Place Prize"
                          fill
                          sizes="150px"
                          className="object-contain p-1"
                        />
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-mono text-[8px] font-black uppercase tracking-wider mb-1">
                        #3 Prize
                      </span>
                      <span className="text-[10px] font-black text-zinc-950 uppercase tracking-tight text-center truncate w-full">
                        Third Place
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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

                    let cardClass = "border-zinc-300 bg-zinc-100/45 hover:bg-zinc-100/60 shadow-[0_4px_12px_rgba(113,113,122,0.06)]"
                    let rankWidget = null
                    let scoreColor = "text-zinc-600 font-extrabold"

                    if (isRank1) {
                      cardClass = "border-orange-400 bg-orange-100/45 hover:bg-orange-100/60 shadow-[0_4px_16px_rgba(249,115,22,0.16)] border-l-4 border-l-orange-500"
                      rankWidget = (
                        <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-orange-100 text-orange-700 border border-orange-200">
                          #1
                        </div>
                      )
                      scoreColor = "text-orange-700 font-extrabold"
                    } else if (isRank2) {
                      cardClass = "border-sky-400 bg-sky-100/45 hover:bg-sky-100/60 shadow-[0_4px_12px_rgba(56,189,248,0.12)]"
                      rankWidget = (
                        <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-sky-100 text-sky-700 border border-sky-200">
                          #2
                        </div>
                      )
                      scoreColor = "text-sky-700 font-extrabold"
                    } else if (isRank3) {
                      cardClass = "border-indigo-400 bg-indigo-100/45 hover:bg-indigo-100/60 shadow-[0_4px_12px_rgba(99,102,241,0.12)]"
                      rankWidget = (
                        <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200">
                          #3
                        </div>
                      )
                      scoreColor = "text-indigo-700 font-extrabold"
                    } else {
                      rankWidget = (
                        <div className={`flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg border ${isMe
                          ? "text-orange-700 bg-orange-100 border-orange-200"
                          : "text-zinc-700 bg-zinc-100 border-zinc-200"
                          }`}>
                          #{entry.rank}
                        </div>
                      )
                      scoreColor = "text-zinc-600 font-extrabold"
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
                            <Crown size={13} className="fill-orange-500 text-orange-600 shrink-0 ml-1.5 align-middle mb-0.5" />
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
