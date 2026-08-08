"use client"

import { useState, useEffect, useCallback } from "react"
import { Gamepad2, Loader2, Trophy, Crown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { LeaderboardData, Tournament } from "@/types"
import { Navbar } from "./Navbar"
import { getUrlForEnv } from "@/lib/sync-env"
import { BackButton } from "./BackButton"
import { RewardsCarousel } from "./RewardsCarousel"

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
  initialTournament?: any | null
  initialLeaderboard?: any | null
  initialPlays?: any[] | null
}


export function TournamentView({
  tournamentId,
  googleId,
  env,
  pid,
  name,
  image,
  initialTournament = null,
  initialLeaderboard = null,
  initialPlays = null,
}: Props) {
  const [tab, setTab] = useState<"leaderboard" | "plays" | "rewards">("leaderboard")
  const searchParams = useSearchParams()

  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(initialLeaderboard)
  const [plays, setPlays] = useState<Gameplay[] | null>(initialPlays)
  const [playsLoaded, setPlaysLoaded] = useState(!!initialPlays)
  const [tournament, setTournament] = useState<Tournament | null>(initialTournament)
  const [isServerOffline, setIsServerOffline] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  // Listen to screen size changes for state-driven desktop columns
  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkWidth()
    window.addEventListener("resize", checkWidth)
    return () => window.removeEventListener("resize", checkWidth)
  }, [])

  // Sync props data dynamically when they change
  useEffect(() => {
    setLeaderboard(initialLeaderboard)
    setPlays(initialPlays)
    setTournament(initialTournament)
  }, [initialLeaderboard, initialPlays, initialTournament])

  // Swipe navigation logic for mobile users
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const touch = e.changedTouches[0]
    const diffX = touchStart.x - touch.clientX
    const diffY = touchStart.y - touch.clientY

    // Ensure it's a clear horizontal swipe (more horizontal than vertical, and > 50px delta)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe Left -> Next Tab
        if (tab === "leaderboard") setTab("plays")
        else if (tab === "plays") setTab("rewards")
      } else {
        // Swipe Right -> Previous Tab
        if (tab === "rewards") setTab("plays")
        else if (tab === "plays") setTab("leaderboard")
      }
    }
    setTouchStart(null)
  }

  const startDateStr = tournament?.started_at
    ? new Date(tournament.started_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : ""

  // ── Fetch single tournament details ────────────────────────────────────────
  useEffect(() => {
    if (isServerOffline) return
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
        setIsServerOffline(true)
        console.warn("Could not load tournament details:", err)
      }
    }
    getTournamentDetails()
  }, [tournamentId, env, isServerOffline])

  // ── Leaderboard polling ────────────────────────────────────────────────────
  const pollLeaderboard = useCallback(async () => {
    if (isServerOffline) return
    try {
      const url = pid
        ? getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard/player/${pid}`, env)
        : getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard?page=1&limit=10`, env)
      const res = await fetch(url)
      if (!res.ok) return
      const data: LeaderboardData = await res.json()
      if (data) {
        setLeaderboard(data)
      }
    } catch {
      setIsServerOffline(true)
    }
  }, [tournamentId, pid, env, isServerOffline])

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
        if (!res.ok) {
          setPlays([])
          return
        }
        const data = await res.json()
        const fetchedPlays = data.gameplays ?? []
        setPlays(fetchedPlays)
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
        className="pointer-events-none absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Hero radial backlight glow - Soft Gray/Slate instead of Orange */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] rounded-full bg-zinc-300/40 blur-[130px]"
      />

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/40 bg-white/80 backdrop-blur-xl shadow-sm transition-all">
        <Navbar name={name} image={image} />
      </header>

      {/* ── Back Navigation Wrapper (Sticky below Navbar) ── */}
      <div className="sticky top-[56px] z-30 bg-transparent py-3 mb-2">
        <div className="mx-auto w-full max-w-6xl px-4 flex justify-start">
          <BackButton />
        </div>
      </div>

      {/* ── Simple Title Header (Clean text, no card) ── */}
      <div className="border-b border-zinc-200/60 pb-5 mb-2 w-full max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-955 uppercase font-sans leading-tight text-left whitespace-normal break-words">
          {tournament?.name || "Tournament"}
        </h1>
        {tournament?.status === "active" && (
          <span className="flex shrink-0 items-center gap-1.5 text-red-600 font-mono font-black uppercase tracking-wider text-xs sm:text-sm">
            <span className="relative flex size-1.5 shrink-0">
              <span className="animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full size-1.5 bg-red-500"></span>
            </span>
            Active
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <main
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-2 pb-8 sm:pt-3 sm:pb-12 flex-grow min-h-[70vh]"
      >

        {/* ── Rewards Display (Carousel or Static cash podium) ── */}
        <div className="mb-6">
          {(!tournament?.rewards || tournament.rewards.length === 0) ? null :
            tournament.rewards.some(r => r.image_url && r.image_url !== "") ? (
              <RewardsCarousel
                bannerUrl={tournament?.banner_url}
                rewards={tournament?.rewards}
                tournamentName={tournament?.name}
              />
            ) : (
              /* Static Cash Prizes Podium Card */
              <div className="w-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white rounded-2xl p-5 sm:p-6 shadow-md select-none relative overflow-hidden border border-amber-500/25">
                {/* Decorative Hanging Lights Overlay */}
                <div className="absolute top-0 inset-x-0 h-8 opacity-40 pointer-events-none z-10 bg-repeat-x" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'%3E%3Cpath d='M0,0 Q10,12 20,0 Q30,12 40,0' fill='none' stroke='white' stroke-width='1'/%3E%3Ccircle cx='10' cy='6' r='2' fill='%23ffeb3b'/%3E%3Ccircle cx='20' cy='0' r='2.5' fill='%23ff1744'/%3E%3Ccircle cx='30' cy='6' r='2' fill='%2300e676'/%3E%3C/svg%3E")`,
                  backgroundSize: '40px 20px'
                }} />

                {/* Shimmer Sweep Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmerSweep_6s_infinite_linear] pointer-events-none" />

                <h3 className="font-mono text-sm sm:text-base text-zinc-955 font-black uppercase tracking-widest mb-4 text-center sm:text-left flex items-center justify-center sm:justify-start gap-1.5 relative z-10 drop-shadow-sm">
                  🏆 Tournament Prizes
                </h3>

                <div className="grid grid-cols-3 gap-3 items-end max-w-2xl mx-auto pt-3 pb-1 relative z-10">
                  {/* 2nd Place Card */}
                  {(() => {
                    const r2 = tournament.rewards.find(r => r.rank === 2);
                    if (!r2) return <div />;
                    return (
                      <div className="relative flex flex-col items-center text-center p-3 sm:p-4 rounded-xl glass-pill-3d !bg-white/95 !border-white shadow-md shadow-[#D9CFC7]/15 transition-all duration-300 md:hover:scale-[1.02] md:hover:border-white/95 h-fit">
                        <span className="font-mono text-xs sm:text-xs text-zinc-800 font-black uppercase tracking-wider block mb-2.5 leading-none">
                          2nd Place
                        </span>
                        <span className="font-sans text-base sm:text-2xl font-black text-zinc-955 tracking-tight leading-none mb-1.5 sm:mb-2 drop-shadow-xs">
                          {r2.prize_money}
                        </span>
                        <span className="font-mono text-[10px] sm:text-xs text-zinc-600 font-bold uppercase tracking-widest leading-none">
                          Cash
                        </span>
                      </div>
                    );
                  })()}

                  {/* 1st Place Card (Centered & Highlighted) */}
                  {(() => {
                    const r1 = tournament.rewards.find(r => r.rank === 1);
                    if (!r1) return <div />;
                    return (
                      <div className="relative flex flex-col items-center text-center p-4 sm:p-5 rounded-xl glass-pill-3d !bg-white/98 !border-white shadow-lg transition-all duration-300 md:hover:scale-[1.02] md:hover:border-white scale-[1.04] z-10">
                        {/* Champ tag */}
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-955 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full leading-none shadow-2xs border border-white/25 select-none">
                          Champ
                        </span>
                        <span className="font-mono text-xs sm:text-xs text-zinc-900 font-black uppercase tracking-wider block mb-3 leading-none">
                          1st Place
                        </span>
                        <span className="font-sans text-lg sm:text-3xl font-black text-zinc-955 tracking-tight leading-none mb-1.5 sm:mb-2 drop-shadow-xs">
                          {r1.prize_money}
                        </span>
                        <span className="font-mono text-[10px] sm:text-xs text-zinc-700 font-bold uppercase tracking-widest leading-none">
                          Cash
                        </span>
                      </div>
                    );
                  })()}

                  {/* 3rd Place Card */}
                  {(() => {
                    const r3 = tournament.rewards.find(r => r.rank === 3);
                    if (!r3) return <div />;
                    return (
                      <div className="relative flex flex-col items-center text-center p-3 sm:p-4 rounded-xl glass-pill-3d !bg-white/95 !border-white shadow-md shadow-[#D9CFC7]/15 transition-all duration-300 md:hover:scale-[1.02] md:hover:border-white/95 h-fit">
                        <span className="font-mono text-xs sm:text-xs text-zinc-800 font-black uppercase tracking-wider block mb-2.5 leading-none">
                          3rd Place
                        </span>
                        <span className="font-sans text-base sm:text-2xl font-black text-zinc-955 tracking-tight leading-none mb-1.5 sm:mb-2 drop-shadow-xs">
                          {r3.prize_money}
                        </span>
                        <span className="font-mono text-[10px] sm:text-xs text-zinc-600 font-bold uppercase tracking-widest leading-none">
                          Cash
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
        </div>

        {/* ── Standalone Banner Image ── */}
        {tournament?.banner_url && (
          <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm flex items-center justify-center p-1 mb-6">
            <img
              src={tournament.banner_url}
              alt="Tournament Banner"
              className="w-full h-auto object-cover max-h-[300px] rounded-xl"
            />
          </div>
        )}

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

        {/* 3D sliding deck */}
        <div
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          className={isMobile ? "w-full overflow-hidden py-4" : "w-full py-4"}
          style={isMobile ? { perspective: "1200px" } : undefined}
        >
          <div
            className={isMobile
              ? "flex w-[300%] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              : "w-full"
            }
            style={isMobile ? {
              transform: `translateX(-${(tab === "leaderboard" ? 0 : tab === "plays" ? 1 : 2) * 33.3333}%)`,
            } : undefined}
          >
            {/* Slide 1: Leaderboard */}
            <div
              className={isMobile ? "w-1/3 px-1 transition-all duration-500 origin-center" : "w-full"}
              style={isMobile ? {
                transform: tab === "leaderboard" ? "scale(1) rotateY(0deg)" : "scale(0.95) rotateY(-8deg)",
                opacity: tab === "leaderboard" ? 1 : 0.15,
                filter: tab === "leaderboard" ? "none" : "blur(2px)",
                pointerEvents: tab === "leaderboard" ? "auto" : "none",
              } : {
                display: tab === "leaderboard" ? "block" : "none"
              }}
            >
              {/* ── Leaderboard tab ────────────────────────────────────────────── */}
              {!leaderboard ? (
                <div className="flex flex-col items-center gap-3 py-20">
                  <Loader2 size={22} className="animate-spin text-primary" aria-hidden />
                  <p className="text-xs text-muted-foreground">Loading leaderboard…</p>
                </div>
              ) : leaderboard.leaderboard.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center select-none animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-100/50 border border-orange-200/30 shadow-sm">
                    <Trophy size={26} className="text-primary animate-pulse" aria-hidden />
                  </div>
                  <div>
                    <p className="text-base font-black text-zinc-900 tracking-tight">No rankings yet</p>
                    <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-zinc-500 mx-auto">
                      No scores have been submitted for this tournament. Play a game to claim your spot on the leaderboard!
                    </p>
                  </div>
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

                        let cardClass = "glass-pill-3d !bg-gradient-to-r !from-[#FFF0FA] !to-[#F3EAFF] md:hover:!from-[#FFF5FC] md:hover:!to-[#F7EFFF] md:active:scale-[0.99] border-pink-200/90 shadow-[0_4px_15px_rgba(232,121,249,0.06)]"
                        let rankWidget = null
                        let scoreColor = "text-zinc-600 font-extrabold"

                        if (isRank1) {
                          cardClass = "glass-pill-3d !bg-none !bg-[#FFDEB3] md:hover:!bg-[#FFD59E] md:active:scale-[0.99] border-[#FFA726] shadow-[0_8px_30px_rgba(249,115,22,0.22)] border-l-4 border-l-orange-500 scale-[1.02] md:transition-transform md:duration-200 z-10"
                          rankWidget = (
                            <div className="text-xl shrink-0 w-6 sm:w-8 flex items-center justify-center select-none">
                              🥇
                            </div>
                          )
                          scoreColor = "text-orange-700 font-extrabold"
                        } else if (isRank2) {
                          cardClass = "glass-pill-3d !bg-none !bg-[#CBE6FF] md:hover:!bg-[#B3D7FF] md:active:scale-[0.99] border-[#4FC3F7] shadow-[0_8px_30px_rgba(3,169,244,0.18)] scale-[1.01] md:transition-transform md:duration-200 z-10"
                          rankWidget = (
                            <div className="text-xl shrink-0 w-6 sm:w-8 flex items-center justify-center select-none">
                              🥈
                            </div>
                          )
                          scoreColor = "text-sky-700 font-extrabold"
                        } else if (isRank3) {
                          cardClass = "glass-pill-3d !bg-none !bg-[#E5DFFF] md:hover:!bg-[#D1C9FF] md:active:scale-[0.99] border-[#9FA8DA] shadow-[0_8px_30px_rgba(99,102,241,0.18)] scale-[1.01] md:transition-transform md:duration-200 z-10"
                          rankWidget = (
                            <div className="text-xl shrink-0 w-6 sm:w-8 flex items-center justify-center select-none">
                              🥉
                            </div>
                          )
                          scoreColor = "text-indigo-700 font-extrabold"
                        } else {
                          rankWidget = (
                            <div className={`font-mono text-base font-black shrink-0 w-6 sm:w-8 flex items-center justify-center ${isMe ? "text-orange-700" : "text-zinc-500"
                              }`}>
                              {entry.rank}
                            </div>
                          )
                          scoreColor = "text-zinc-600 font-extrabold"
                        }

                        if (isMe) {
                          if (!isRank1 && !isRank2 && !isRank3) {
                            cardClass = "glass-pill-3d !bg-gradient-to-r !from-[#FFF0FA] !to-[#F3EAFF] md:hover:!from-[#FFF5FC] md:hover:!to-[#F7EFFF] md:active:scale-[0.99] border-emerald-500 shadow-md border-2"
                          } else {
                            cardClass = `${cardClass} border-emerald-500 border-2`
                          }
                        }

                        return (
                          <div
                            key={entry.rank}
                            className={`relative flex items-center gap-2.5 rounded-xl px-4 py-4 sm:py-4.5 sm:px-5 transition-all duration-200 ${cardClass}`}
                          >
                            {isMe && (
                              <span className="absolute -top-2.5 left-14 px-2 py-0.5 rounded bg-emerald-500 text-white font-mono text-xs font-black uppercase tracking-wider shadow-sm z-10 leading-none">
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
                                name={entry.players.map(p => p?.name).filter(Boolean).join(", ") || entry.center?.name || "?"}
                              />
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0 pr-1">
                              <p className={`text-base font-bold leading-tight ${isMe ? "text-emerald-950" : "text-zinc-900"}`}>
                                <span>
                                  {entry.players.map(p => p?.name).filter(Boolean).join(", ") || entry.center?.name || "Unknown"}
                                </span>
                                {isRank1 && (
                                  <Crown size={13} className="fill-orange-500 text-orange-600 shrink-0 inline-block ml-1 align-middle" />
                                )}
                              </p>
                            </div>

                            {/* Score */}
                            <div className={`font-mono text-base font-bold tabular-nums ${scoreColor} leading-none flex items-center justify-start gap-0.5 min-w-[80px] pl-3 shrink-0`}>
                              <div className="w-3.5 flex items-center justify-start shrink-0">
                                {isRank1 && <Trophy size={14} className="fill-amber-400 text-amber-500 shrink-0" />}
                                {isRank2 && <Trophy size={14} className="fill-slate-300 text-slate-400 shrink-0" />}
                                {isRank3 && <Trophy size={14} className="fill-orange-400 text-orange-500 shrink-0" />}
                              </div>
                              <span className="text-left">
                                {entry.score.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>

                </>)}
            </div>

            {/* Slide 2: My Plays */}
            <div
              className={isMobile ? "w-1/3 px-1 transition-all duration-500 origin-center" : "w-full"}
              style={isMobile ? {
                transform: tab === "plays" ? "scale(1) rotateY(0deg)" : tab === "leaderboard" ? "scale(0.95) rotateY(8deg)" : "scale(0.95) rotateY(-8deg)",
                opacity: tab === "plays" ? 1 : 0.15,
                filter: tab === "plays" ? "none" : "blur(2px)",
                pointerEvents: tab === "plays" ? "auto" : "none",
              } : {
                display: tab === "plays" ? "block" : "none"
              }}
            >
              {/* ── My Plays tab ───────────────────────────────────────────────── */}
              {!playsLoaded ? (
                <div className="flex flex-col items-center gap-3 py-20">
                  <Loader2 size={22} className="animate-spin text-primary" aria-hidden />
                  <p className="text-sm text-muted-foreground">Loading plays…</p>
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

                      let cardClass = "glass-pill-3d !bg-white/98 relative flex items-start justify-between rounded-xl p-4 sm:p-5 border border-zinc-350 shadow-xs transition-all duration-200"
                      let iconBg = "bg-zinc-100 text-zinc-500 border border-zinc-200/50"
                      let iconElement = <Gamepad2 size={16} />
                      let bestPlayBadge = null

                      if (isBestPlay) {
                        if (finalRank === 1) {
                          cardClass = "glass-pill-3d !bg-orange-200 relative flex items-start justify-between rounded-xl p-4 sm:p-5 border border-orange-300 border-l-4 border-l-orange-500 shadow-xs transition-all duration-200"
                          iconBg = "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm"
                          iconElement = <Crown size={16} />
                          bestPlayBadge = (
                            <span className="absolute -top-3 left-14 px-3 py-1 rounded bg-orange-500 text-white font-mono text-[10.5px] sm:text-[13px] font-black uppercase tracking-wider shadow-md z-10 leading-none flex items-center gap-1">
                              👑 Personal Best
                            </span>
                          )
                        } else if (finalRank === 2) {
                          cardClass = "glass-pill-3d !bg-sky-200 relative flex items-start justify-between rounded-xl p-4 sm:p-5 border border-sky-300 border-l-4 border-l-sky-500 shadow-xs transition-all duration-200"
                          iconBg = "bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-sm"
                          iconElement = <Trophy size={16} />
                          bestPlayBadge = (
                            <span className="absolute -top-3 left-14 px-3 py-1 rounded bg-sky-500 text-white font-mono text-[10.5px] sm:text-[13px] font-black uppercase tracking-wider shadow-md z-10 leading-none flex items-center gap-1">
                              🏆 Personal Best
                            </span>
                          )
                        } else if (finalRank === 3) {
                          cardClass = "glass-pill-3d !bg-indigo-200 relative flex items-start justify-between rounded-xl p-4 sm:p-5 border border-indigo-300 border-l-4 border-l-indigo-500 shadow-xs transition-all duration-200"
                          iconBg = "bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-sm"
                          iconElement = <Trophy size={16} />
                          bestPlayBadge = (
                            <span className="absolute -top-3 left-14 px-3 py-1 rounded bg-indigo-500 text-white font-mono text-[10.5px] sm:text-[13px] font-black uppercase tracking-wider shadow-md z-10 leading-none flex items-center gap-1">
                              🏆 Personal Best
                            </span>
                          )
                        } else {
                          cardClass = "glass-pill-3d !bg-amber-200 relative flex items-start justify-between rounded-xl p-4 sm:p-5 border border-amber-300 border-l-4 border-l-amber-500 shadow-xs transition-all duration-200"
                          iconBg = "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm"
                          iconElement = <Trophy size={16} />
                          bestPlayBadge = (
                            <span className="absolute -top-3 left-14 px-3 py-1 rounded bg-amber-500 text-white font-mono text-[10.5px] sm:text-[13px] font-black uppercase tracking-wider shadow-md z-10 leading-none flex items-center gap-1">
                              🏆 Personal Best
                            </span>
                          )
                        }
                      }

                      return (
                        <div
                          key={`${g.gameplay_id}-${index}`}
                          className={`transition-all duration-200 ${cardClass}`}
                        >
                          {bestPlayBadge}
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            {/* Status Icon Indicator */}
                            <div className={`flex size-9.5 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${iconBg}`}>
                              {iconElement}
                            </div>

                            {/* Date/Time info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap text-left">
                                <p className="font-mono text-base sm:text-lg font-extrabold text-zinc-800 leading-none whitespace-nowrap">
                                  {new Date(g.played_at).toLocaleDateString("en-US", {
                                    month: "short", day: "numeric", year: "numeric",
                                  })}
                                </p>
                                {/* badge removed to top border */}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                                <p className="font-mono text-sm text-zinc-500 font-bold uppercase tracking-wider leading-none whitespace-nowrap">
                                  {new Date(g.played_at).toLocaleTimeString("en-US", {
                                    hour: "2-digit", minute: "2-digit",
                                  })}
                                </p>
                                {g.center_name && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-wider leading-none shadow-3xs whitespace-nowrap shrink-0">
                                    {g.center_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Score display */}
                          <div className="text-right shrink-0 pl-3">
                            <p className="font-mono text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest leading-none mb-1 font-bold">
                              Score
                            </p>
                            <p className="font-mono text-lg sm:text-xl md:text-2xl font-black tabular-nums text-zinc-950 leading-none">
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
                    <p className="text-base font-black text-zinc-900 tracking-tight">No plays yet</p>
                    <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-zinc-500 mx-auto">
                      Your scores for this tournament will appear here after you play.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Slide 3: My Rewards */}
            <div
              className={isMobile ? "w-1/3 px-1 transition-all duration-500 origin-center" : "w-full"}
              style={isMobile ? {
                transform: tab === "rewards" ? "scale(1) rotateY(0deg)" : "scale(0.95) rotateY(8deg)",
                opacity: tab === "rewards" ? 1 : 0.15,
                filter: tab === "rewards" ? "none" : "blur(2px)",
                pointerEvents: tab === "rewards" ? "auto" : "none",
              } : {
                display: tab === "rewards" ? "block" : "none"
              }}
            >
              {(() => {
                const userTopEntry = leaderboard?.leaderboard.find((e) =>
                  e.players.some((p) => p.name === name)
                )
                const finalRank = pid ? leaderboard?.player?.rank : userTopEntry?.rank

                const hasWon = finalRank !== undefined && finalRank >= 1 && finalRank <= 3
                const dbReward = tournament?.rewards?.find((r) => r.rank === finalRank)

                let prizeAmount = dbReward?.prize_money ?? ""
                let medalEmoji = ""
                let rankTitle = dbReward?.title ?? ""

                let bannerClass = ""
                let congratsText = ""
                if (finalRank === 1) {
                  if (!rankTitle) rankTitle = "Tournament Champion"
                  medalEmoji = "🥇"
                  bannerClass = "reward-banner-gold glass-pill-3d !bg-amber-200 border-2 border-amber-400 shadow-md shadow-amber-500/10"
                  congratsText = "CONGRATULATIONS CHAMPION!"
                } else if (finalRank === 2) {
                  if (!rankTitle) rankTitle = "Runner-Up Prize"
                  medalEmoji = "🥈"
                  bannerClass = "reward-banner-silver glass-pill-3d !bg-slate-200 border-2 border-slate-300 shadow-md shadow-slate-500/10"
                  congratsText = "AWESOME PLAY, RUNNER-UP!"
                } else if (finalRank === 3) {
                  if (!rankTitle) rankTitle = "Third Place Prize"
                  medalEmoji = "🥉"
                  bannerClass = "reward-banner-bronze glass-pill-3d !bg-indigo-200 border-2 border-indigo-300 shadow-md shadow-indigo-500/10"
                  congratsText = "FANTASTIC JOB, 3RD PLACE!"
                }

                return (
                  <div className="space-y-2.5 select-none animate-none">
                    <style>{`
                @keyframes rewardsPop {
                  0% { opacity: 0; transform: scale(0.95) translateY(15px); }
                  70% { transform: scale(1.01) translateY(-2px); }
                  100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes floatMedal {
                  0% { transform: translateY(0px) rotate(0deg) scale(1); }
                  50% { transform: translateY(-8px) rotate(5deg) scale(1.06); }
                  100% { transform: translateY(0px) rotate(0deg) scale(1); }
                }
                @keyframes bannerShimmer {
                  0% { background-position: -200% center; }
                  100% { background-position: 200% center; }
                }
                @keyframes claimPulse {
                  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.15); }
                  50% { box-shadow: 0 0 15px 5px rgba(0, 0, 0, 0.08); }
                }
                .reward-banner-gold {
                  -webkit-transform: translate3d(0, 0, 0);
                  transform: translate3d(0, 0, 0);
                  animation: rewardsPop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .reward-banner-silver {
                  -webkit-transform: translate3d(0, 0, 0);
                  transform: translate3d(0, 0, 0);
                  animation: rewardsPop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .reward-banner-bronze {
                  -webkit-transform: translate3d(0, 0, 0);
                  transform: translate3d(0, 0, 0);
                  animation: rewardsPop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .reward-medal-anim {
                  animation: floatMedal 3.5s ease-in-out infinite;
                }
                .reward-shimmer-effect {
                  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent);
                  background-size: 200% 100%;
                  animation: bannerShimmer 4s infinite linear;
                }
                .claim-btn-pulse {
                  animation: claimPulse 2.5s infinite;
                }
              `}</style>

                    {hasWon ? (
                      <div className={`relative flex flex-row items-center justify-between rounded-3xl p-5 sm:p-7 overflow-hidden gap-4 w-full transition-all duration-200 border border-zinc-200 bg-white ${bannerClass}`}>
                        {/* Shimmer sweep */}
                        <div className="absolute inset-0 reward-shimmer-effect pointer-events-none opacity-40" />

                        {/* Left Section: Medal & Clean Title */}
                        <div className="flex flex-row items-center gap-4.5 z-10 min-w-0">
                          {/* Mini Medal Container */}
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm text-2xl select-none bg-white border border-zinc-100">
                            {medalEmoji}
                          </div>

                          {/* Simple Title */}
                          <div className="min-w-0 flex-1 text-left pr-2 sm:pr-3">
                            <h2 className="font-sans text-sm min-[360px]:text-base sm:text-lg md:text-xl font-black text-zinc-955 uppercase leading-snug tracking-tight break-normal">
                              {tournament?.name || "EPIC Tournament"}
                            </h2>
                            <span className="font-mono text-[10px] sm:text-xs font-black tracking-widest text-[#6e635c]/90 uppercase block leading-none mt-1">
                              {finalRank === 1 ? "1st Place Winner" : finalRank === 2 ? "2nd Place Winner" : "3rd Place Winner"}
                            </span>
                          </div>
                        </div>

                        {/* Right Section: Large Prize Won Showcase */}
                        <div className="shrink-0 z-10">
                          {!dbReward?.image_url || dbReward.image_url === "" ? (
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center rounded-2xl p-3 bg-white border border-zinc-100 shadow-sm text-center">
                              <span className="text-xl sm:text-2xl mb-1 sm:mb-1.5 select-none">💵</span>
                              <span className="font-sans text-base sm:text-lg font-extrabold text-zinc-955 tracking-tight leading-none">
                                {prizeAmount}
                              </span>
                            </div>
                          ) : (
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center rounded-2xl p-2 bg-white border border-zinc-100 shadow-sm group/prize transition-transform duration-300 hover:scale-105">
                              <img
                                src={dbReward.image_url}
                                alt="Prize Reward"
                                className="max-w-full max-h-full object-contain rounded-xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Status Banner */
                      <div className="glass-pill-3d relative overflow-hidden !bg-gradient-to-br !from-amber-100/40 !to-orange-100/30 border-2 border-white/65 p-4.5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left transition-all duration-200 shadow-lg shadow-orange-500/5 rounded-3xl">
                        {/* Liquid shimmer sweep */}
                        <div className="absolute inset-0 reward-shimmer-effect pointer-events-none opacity-45" />

                        <div className="flex items-center gap-4 min-w-0 z-10">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100/60 border border-orange-200/50 shadow-3xs">
                            <Trophy size={20} className="text-orange-500 fill-orange-200" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-sans text-lg sm:text-xl font-black text-zinc-900 leading-tight">
                              No rewards won yet
                            </h3>
                            <p className="mt-1.5 font-mono text-xs sm:text-sm text-[#6e635c] font-bold uppercase tracking-wider leading-none flex items-center gap-1.5 flex-wrap">
                              <span>Current Rank:</span>
                              <span className="px-2 py-0.5 rounded bg-orange-100/40 border border-orange-300/40 text-orange-800 font-black">
                                {finalRank != null ? `#${finalRank}` : "UNRANKED"}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setTab("leaderboard")}
                          className="w-full sm:w-auto shrink-0 py-2.5 px-4.5 rounded-xl border border-orange-300/40 bg-orange-100/50 hover:bg-orange-200/50 active:scale-98 shadow-xs text-[11px] font-bold text-orange-700 uppercase tracking-wider transition-all cursor-pointer text-center z-10 backdrop-blur-xs"
                        >
                          View Leaderboard
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

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
