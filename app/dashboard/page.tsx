import { getServerSession } from "next-auth"
// Trigger rebuild
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Gamepad2, Trophy, Star, ChevronRight, Crown, ShieldCheck, QrCode } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { SYNC_ENV, getUrlForEnv, getSyncOfflineStatus, setSyncOffline } from "@/lib/sync-env"
import { getPlayerByGoogleId, getPlayerByEmail } from "@/lib/players"
import { RewardsCarousel } from "@/components/RewardsCarousel"
import { LocalTime } from "@/components/LocalTime"

const SYNC = process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? ""

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlayerStats {
  games_played: number
  best_score: number
  global_rank: number
}

interface PlayerGameplay {
  gameplay_id: string
  tournament_id: string
  score: number
  played_at: string
  center_name?: string | null
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000) {
  if (getSyncOfflineStatus()) {
    throw new Error("Sync server is offline")
  }
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    setSyncOffline(true)
    throw err
  }
}

async function fetchStats(googleId: string, env: string): Promise<PlayerStats | null> {
  try {
    const res = await fetchWithTimeout(
      getUrlForEnv(`${SYNC}/api/v1/player/${googleId}/stats`, env),
      { next: { revalidate: 3 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchGameplays(googleId: string, env: string): Promise<PlayerGameplay[]> {
  try {
    const res = await fetchWithTimeout(
      getUrlForEnv(`${SYNC}/api/v1/player/${googleId}/gameplays?limit=10`, env),
      { next: { revalidate: 3 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.gameplays ?? []
  } catch {
    return []
  }
}

interface LeaderboardEntry {
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

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  player?: {
    rank: number
    best_score: number
  } | null
}

async function fetchActiveTournament(env: string): Promise<any | null> {
  try {
    const res = await fetchWithTimeout(
      getUrlForEnv(`${SYNC}/api/v1/tournaments?limit=10`, env),
      { next: { revalidate: 3 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const found = data.tournaments?.find((t: any) => t.status === "active")
    return found || null
  } catch {
    return null
  }
}

async function fetchLeaderboard(tournamentId: string, env: string, playerId?: string): Promise<LeaderboardData | null> {
  try {
    const url = playerId
      ? getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard/player/${playerId}`, env)
      : getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard?page=1&limit=5`, env)
    const res = await fetchWithTimeout(url, { next: { revalidate: 3 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

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

// ── Components ────────────────────────────────────────────────────────────────

function ShimmerEdge({ background, onlyTop = false }: { background?: string; onlyTop?: boolean }) {
  const bgStyleX = background ?? "linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)"
  const bgStyleY = bgStyleX.includes("90deg")
    ? bgStyleX.replace("90deg", "180deg")
    : "linear-gradient(180deg, transparent 0%, var(--primary) 50%, transparent 100%)"
  return (
    <>
      {/* Top Border */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-no-repeat animate-shimmer-slide z-20"
        style={{
          background: bgStyleX,
        }}
      />
      {!onlyTop && (
        <>
          {/* Bottom Border */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-no-repeat animate-shimmer-slide z-20"
            style={{
              background: bgStyleX,
            }}
          />
          {/* Left Border */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-no-repeat animate-shimmer-slide-y z-20"
            style={{
              background: bgStyleY,
            }}
          />
          {/* Right Border */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-no-repeat animate-shimmer-slide-y z-20"
            style={{
              background: bgStyleY,
            }}
          />
        </>
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  const sp = await searchParams
  const env = Array.isArray(sp.env) ? sp.env[0] : (sp.env ?? SYNC_ENV)

  const { name, email, image, google_id } = session.user

  // Look up player by email first to support dynamic account switching by email address
  let dbPlayer = email ? await getPlayerByEmail(email) : null
  if (!dbPlayer && google_id) {
    dbPlayer = await getPlayerByGoogleId(google_id)
  }

  const resolvedName = dbPlayer?.name ?? name
  const firstName = resolvedName?.split(" ")[0] ?? "Player"
  const resolvedGoogleId = dbPlayer?.google_id || google_id

  const [stats, rawGameplays, fetchedActiveTournament] = await Promise.all([
    fetchStats(resolvedGoogleId, env),
    fetchGameplays(resolvedGoogleId, env),
    fetchActiveTournament(env),
  ])

  const activeTournament = fetchedActiveTournament

  const pid = dbPlayer ? dbPlayer._id.toString() : undefined
  const rawLeaderboardData = activeTournament ? await fetchLeaderboard(activeTournament._id, env, pid) : null

  const leaderboardData = rawLeaderboardData || { leaderboard: [], player: null }
  const gameplays = rawGameplays || []

  // Sort gameplays by date descending (newest first) so that new play gets added on top
  const sortedGameplays = [...gameplays].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  // Calculate stats progress bar widths
  const playerLevel = Math.max(1, Math.floor((stats?.games_played ?? 0) / 5) + 1)
  const nextLevelPercent = (((stats?.games_played ?? 0) % 5) / 5) * 100
  const gamesForNextLevel = 5 - ((stats?.games_played ?? 0) % 5)

  // Calculate Score Tiers
  let scoreTier = "ROOKIE"
  const bestScore = stats?.best_score ?? 0
  if (bestScore >= 100000) scoreTier = "GRANDMASTER"
  else if (bestScore >= 50000) scoreTier = "CHAMPION"
  else if (bestScore >= 10000) scoreTier = "ELITE"
  else if (bestScore >= 1000) scoreTier = "CHALLENGER"

  const statCards = [
    {
      label: "Games Played",
      value: stats?.games_played != null ? stats.games_played.toLocaleString() : "—",
      Icon: Gamepad2,
      iconClass: "bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      valueClass: "bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent",
      cardBaseClass: "border-cyan-400/80 bg-cyan-100/45 backdrop-blur-md shadow-[0_4px_14px_rgba(6,182,212,0.1)] hover:border-cyan-500 hover:bg-cyan-100/60 hover:shadow-[0_8px_24px_rgba(6,182,212,0.2)] hover:-translate-y-0.5 transition-all duration-300",
      shimmerBg: "linear-gradient(90deg, transparent, color-mix(in oklch, #06b6d4 35%, transparent), transparent)",
    },
    {
      label: "Best Score",
      value: stats?.best_score != null ? stats.best_score.toLocaleString() : "—",
      Icon: Trophy,
      iconClass: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]",
      valueClass: "bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent",
      cardBaseClass: "border-amber-400/80 bg-amber-100/45 backdrop-blur-md shadow-[0_4px_14px_rgba(245,158,11,0.1)] hover:border-amber-500 hover:bg-amber-100/60 hover:shadow-[0_8px_24px_rgba(245,158,11,0.2)] hover:-translate-y-0.5 transition-all duration-300",
      shimmerBg: "linear-gradient(90deg, transparent, color-mix(in oklch, #f59e0b 35%, transparent), transparent)",
    },
    {
      label: "Global Rank",
      value: stats?.global_rank != null ? `#${stats.global_rank}` : "—",
      Icon: Star,
      iconClass: "bg-gradient-to-br from-violet-400 to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]",
      valueClass: "bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent",
      cardBaseClass: "border-indigo-400/80 bg-indigo-100/45 backdrop-blur-md shadow-[0_4px_14px_rgba(99,102,241,0.1)] hover:border-indigo-500 hover:bg-indigo-100/60 hover:shadow-[0_8px_24px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 transition-all duration-300",
      shimmerBg: "linear-gradient(90deg, transparent, color-mix(in oklch, #6366f1 35%, transparent), transparent)",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-zinc-900 relative overflow-hidden select-none">
      <style>{`
        @keyframes hoverShineSweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .hover-shine-sweep {
          position: absolute;
          top: 0;
          height: 100%;
          width: 50%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transform: skewX(-25deg);
          pointer-events: none;
          z-index: 10;
        }
        @keyframes liquidShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .liquid-card-bg {
          background: linear-gradient(135deg, #FFF0FA 0%, #F5E6FF 50%, #FFF0FA 100%);
          background-size: 200% 200%;
          animation: liquidShimmer 6s ease infinite;
        }
      `}</style>

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


      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/40 bg-white/80 backdrop-blur-xl shadow-sm transition-all">
        <Navbar name={resolvedName} image={dbPlayer?.avatar_url ?? image} />
      </header>

      {/* ── Main Dashboard Container ── */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:py-12 space-y-6 sm:space-y-8 flex-grow w-full">

        {/* ── Simple Welcome Header (Clean text, no card) ── */}
        <div className="border-b border-zinc-200/60 pb-5 mb-2 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-955 uppercase font-sans leading-none text-center sm:text-left">
            Welcome Back, {firstName}!
          </h1>
        </div>

        {/* ── Flat Responsive Layout: History -> Leaderboard -> Rewards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 md:gap-12 items-stretch w-full pb-8">

          {/* 1. Available Rewards Section */}
          <div className="space-y-6 w-full">
            {/* Standalone Slideshow Carousel */}
            <RewardsCarousel
              bannerUrl={activeTournament?.banner_url}
              rewards={activeTournament?.rewards}
              tournamentName={activeTournament?.name}
            />
          </div>

          {/* 2. Tournament Leaderboard Card */}
          <Link
            href={env ? `/tournaments?env=${env}` : "/tournaments"}
            className="group/leaderboardcard glass-panel-3d relative flex flex-col justify-between overflow-hidden !bg-pink-50/20 !border-pink-300 shadow-[0_4px_20px_rgba(190,24,74,0.08)] p-4 sm:p-6 transition-all duration-300 hover:!border-pink-500 hover:!bg-pink-50/30 hover:shadow-[0_8px_30px_rgba(190,24,74,0.15)] active:!bg-pink-50/25 active:scale-[0.98] hover:-translate-y-0.5 w-full h-full md:row-span-2"
          >
            {/* Hover Shine Sweep Overlay */}
            <div className="hover-shine-sweep opacity-0 md:group-hover/leaderboardcard:opacity-100 md:group-active/leaderboardcard:opacity-100 md:group-active/leaderboardcard:animate-[hoverShineSweep_0.8s_ease-out_forwards]" />
            <div className="flex flex-col justify-between h-full flex-grow relative z-20">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-pink-200/30 w-full">
                  <div className="flex items-start gap-1.5 text-pink-700 font-sans text-sm sm:text-base font-black tracking-wide uppercase min-w-0 flex-grow mr-2">
                    {/* Live pulse dot */}
                    <span className="relative flex size-2 shrink-0 mt-[5px]">
                      <span className="animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-60"></span>
                      <span className="relative inline-flex rounded-full size-2 bg-pink-700"></span>
                    </span>
                    <span className="whitespace-normal break-words leading-tight">
                      {activeTournament?.name || "Active Tournament"}
                    </span>
                  </div>
                  <span className="inline-flex items-center justify-center gap-1.5 pl-3.5 pr-2.5 py-1.5 sm:pl-5 sm:pr-3.5 sm:py-2 rounded-full bg-pink-700/80 text-white border-pink-700/80 shadow-[0_4px_12px_rgba(190,24,74,0.18)] sm:bg-pink-50/50 sm:text-pink-700 sm:border-pink-200 sm:shadow-[0_2px_8px_rgba(190,24,74,0.08)] transition-all duration-300 group-hover/leaderboardcard:bg-pink-700/80 group-hover/leaderboardcard:text-white group-hover/leaderboardcard:border-pink-700/80 group-hover/leaderboardcard:shadow-[0_0_20px_rgba(190,24,74,0.35)] group-hover/leaderboardcard:translate-x-0.5 shrink-0">
                    <span className="font-mono text-[11px] sm:text-sm font-black uppercase tracking-wider">
                      ENTER ARENA
                    </span>
                    <ChevronRight size={13} className="transition-transform group-hover/leaderboardcard:translate-x-0.5 shrink-0" />
                  </span>
                </div>

                <div className="w-full text-center">
                  <h3 className="text-xl sm:text-2xl font-black tracking-wide bg-gradient-to-r from-orange-500 via-red-600 to-red-800 bg-clip-text text-transparent transition-all duration-300 drop-shadow-[0_1px_1px_rgba(239,68,68,0.05)]">
                    Leaderboard
                  </h3>
                  {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                    <div className="mt-3.5 flex flex-col gap-2.5 w-full max-w-md mx-auto">
                      {(() => {
                        const top5 = leaderboardData.leaderboard.slice(0, 5)
                        const playerRank = leaderboardData.player?.rank
                        const isPlayerInTop5 = playerRank != null && top5.some((e) => e.rank === playerRank)

                        const displayedEntries = [...top5]
                        if (playerRank != null && !isPlayerInTop5) {
                          const bestGameplay = gameplays.find((g) => g.score === leaderboardData.player!.best_score)
                          const playerCenterName = bestGameplay?.center_name

                          displayedEntries.push({
                            rank: playerRank,
                            score: leaderboardData.player!.best_score,
                            played_at: "",
                            center: playerCenterName ? { _id: "", name: playerCenterName } : undefined,
                            players: [
                              {
                                name: resolvedName ?? "You",
                                avatar_url: image ?? "",
                              },
                            ],
                          })
                        }

                        return displayedEntries.map((entry) => {
                          const isRank1 = entry.rank === 1
                          const isRank2 = entry.rank === 2
                          const isRank3 = entry.rank === 3
                          const isMe = playerRank != null && entry.rank === playerRank

                          let cardClass = "glass-pill-3d liquid-card-bg md:active:scale-[0.99] border-pink-200/90 shadow-[0_4px_15px_rgba(232,121,249,0.08)] transition-all duration-300 relative overflow-hidden"
                          let rankWidget = (
                            <div className={`font-mono text-base font-black shrink-0 w-6 sm:w-8 flex items-center justify-center ${isMe ? "text-orange-700" : "text-zinc-500"}`}>
                              {entry.rank}
                            </div>
                          )
                          let scoreColor = "text-zinc-600 font-extrabold"

                          if (isRank1) {
                            cardClass = "glass-pill-3d !bg-none !bg-[#FFD2A0] md:hover:!bg-[#FFC78A] md:active:scale-[0.99] border-[#FFA726] shadow-[0_8px_30px_rgba(249,115,22,0.22)] border-l-4 border-l-orange-500 scale-[1.02] md:transition-transform md:duration-200 z-10"
                            rankWidget = (
                              <div className="text-xl shrink-0 w-6 sm:w-8 flex items-center justify-center select-none">
                                🥇
                              </div>
                            )
                            scoreColor = "text-orange-800 font-extrabold"
                          } else if (isRank2) {
                            cardClass = "glass-pill-3d !bg-none !bg-[#B2DCFF] md:hover:!bg-[#9ECEFF] md:active:scale-[0.99] border-[#4FC3F7] shadow-[0_8px_30px_rgba(3,169,244,0.18)] scale-[1.01] md:transition-transform md:duration-200 z-10"
                            rankWidget = (
                              <div className="text-xl shrink-0 w-6 sm:w-8 flex items-center justify-center select-none">
                                🥈
                              </div>
                            )
                            scoreColor = "text-sky-800 font-extrabold"
                          } else if (isRank3) {
                            cardClass = "glass-pill-3d !bg-none !bg-[#D8CFFF] md:hover:!bg-[#C8BAFF] md:active:scale-[0.99] border-[#9FA8DA] shadow-[0_8px_30px_rgba(99,102,241,0.18)] scale-[1.01] md:transition-transform md:duration-200 z-10"
                            rankWidget = (
                              <div className="text-xl shrink-0 w-6 sm:w-8 flex items-center justify-center select-none">
                                🥉
                              </div>
                            )
                            scoreColor = "text-indigo-800 font-extrabold"
                          }

                          if (isMe) {
                            if (!isRank1 && !isRank2 && !isRank3) {
                              cardClass = "glass-pill-3d liquid-card-bg border-emerald-500 shadow-md border-2 transition-all duration-300 relative"
                            } else {
                              cardClass = `${cardClass} border-emerald-500 border-2`
                            }
                          }

                          return (
                            <div
                              key={entry.rank}
                              className={`relative flex items-center gap-2.5 sm:gap-3.5 rounded-xl px-4 py-4 sm:py-4.5 sm:px-5 transition-all duration-200 text-left ${cardClass}`}
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
                                <p className={`text-base font-bold leading-tight ${isMe ? "text-emerald-950" : "text-zinc-905"}`}>
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
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500 leading-normal font-medium max-w-xs mx-auto">
                      No active standings yet. Sync scores to start the ladder.
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="my-4 sm:my-6 border-t border-pink-200/30" />
              </div>

              {/* Performance Telemetry Block */}
              <div>
                <p className="font-sans text-sm font-black tracking-widest text-pink-700 uppercase mb-2.5 text-center">
                  Your Performance Status
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Games Played */}
                  <div className="glass-pill-3d !bg-cyan-200 border border-cyan-300 shadow-[0_4px_12px_rgba(6,182,212,0.08)] flex flex-col items-center justify-start text-center rounded-xl p-3 sm:p-4 w-full">
                    <p className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-cyan-955">
                      {stats?.games_played != null ? stats.games_played.toLocaleString() : "—"}
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold tracking-wider text-cyan-800 uppercase leading-snug">
                      Games<br />Played
                    </p>
                  </div>

                  {/* Best Score */}
                  <div className="glass-pill-3d !bg-amber-200 border border-amber-300 shadow-[0_4px_12px_rgba(245,158,11,0.08)] flex flex-col items-center justify-start text-center rounded-xl p-3 sm:p-4 w-full">
                    <p className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-amber-955">
                      {stats?.best_score != null ? stats.best_score.toLocaleString() : "—"}
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold tracking-wider text-amber-800 uppercase leading-snug">
                      Best<br />Score
                    </p>
                  </div>

                  {/* Global Rank */}
                  <div className="glass-pill-3d !bg-indigo-200 border border-indigo-300 shadow-[0_4px_12px_rgba(99,102,241,0.08)] flex flex-col items-center justify-start text-center rounded-xl p-3 sm:p-4 w-full">
                    <p className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-indigo-950">
                      {stats?.global_rank != null ? `# ${stats.global_rank}` : "—"}
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold tracking-wider text-indigo-800 uppercase leading-snug">
                      Global<br />Rank
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </Link>

          {/* 3. Cabinet Session History Card */}
          <div className="glass-panel-3d relative flex flex-col justify-start overflow-hidden !bg-white/40 !border-[#D9CFC7]/60 p-4 sm:p-6 h-full min-h-[220px] w-full shadow-xs">
            <div className="mb-4 sm:mb-6 flex items-center justify-between border-b border-[#D9CFC7]/40 pb-3">
              <p className="font-mono text-base font-black tracking-wide sm:tracking-[0.25em] text-muted-foreground/60 uppercase">
                Session History
              </p>
            </div>

            <div>
              {gameplays.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-6 sm:py-10 border border-dashed border-[#8a7f77]/40 rounded-xl bg-[#D9CFC7]/30 min-h-[120px] sm:min-h-[140px]">
                  <div className="p-3 sm:p-4 rounded-2xl bg-white/60 mb-3 sm:mb-4 inline-flex">
                    <QrCode size={24} className="text-orange-600 sm:size-7" />
                  </div>
                  <p className="text-base font-black text-[#3c342f] tracking-tight">No synced sessions</p>
                  <p className="mt-2 max-w-[320px] text-sm text-[#5d534c] leading-relaxed px-4 mx-auto">
                    Sync your profile key at any active FOG arcade machine to register scores.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3 max-h-[300px] overflow-y-auto pr-3 scrollbar-thin">
                  {sortedGameplays.slice(0, 10).map((g, index) => (
                    <div
                      key={`${g.gameplay_id}-${index}`}
                      className="glass-pill-3d !bg-gradient-to-br !from-pink-200/40 !to-violet-200/40 border border-pink-300/60 relative flex items-center justify-between rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-xs"
                    >
                      {/* Date / Time */}
                      <div className="min-w-0 flex-1 text-left">
                        <p className="font-mono text-base font-bold text-zinc-900 uppercase tracking-wide">
                          {g.center_name || resolvedName || "FOG Cabinet"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <p className="font-mono text-sm text-zinc-500">
                            {/* Render time in local timezone */}
                            <LocalTime isoString={g.played_at} type="time" />
                          </p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="font-mono text-lg font-bold tabular-nums text-zinc-900">
                          {g.score.toLocaleString()}
                        </p>
                        <p className="mt-0.5 font-mono text-sm text-[#6e635c] uppercase tracking-widest flex items-center gap-0.5 justify-end">
                          <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                          <span>
                            {/* Render date in local timezone */}
                            <LocalTime isoString={g.played_at} type="date" />
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      <footer className="relative z-10 border-t border-zinc-200 py-4 text-center bg-zinc-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center font-mono text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide sm:tracking-widest text-center">
          <span>© {new Date().getFullYear()} FOG Technologies Pvt. Limited</span>
        </div>
      </footer>

    </div>
  )
}
