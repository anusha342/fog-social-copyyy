import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Gamepad2, Trophy, Star, ChevronRight } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { SYNC_ENV, getUrlForEnv } from "@/lib/sync-env"
import { getPlayerByGoogleId, getPlayerByEmail } from "@/lib/players"

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

async function fetchStats(googleId: string): Promise<PlayerStats | null> {
  try {
    const res = await fetch(
      getUrlForEnv(`${SYNC}/api/v1/player/${googleId}/stats`, SYNC_ENV),
      { cache: "no-store" }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchGameplays(googleId: string): Promise<PlayerGameplay[]> {
  try {
    const res = await fetch(
      getUrlForEnv(`${SYNC}/api/v1/player/${googleId}/gameplays?limit=10`, SYNC_ENV),
      { cache: "no-store" }
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

async function fetchActiveTournament(): Promise<any | null> {
  try {
    const res = await fetch(
      getUrlForEnv(`${SYNC}/api/v1/tournaments?limit=10`, SYNC_ENV),
      { cache: "no-store" }
    )
    if (!res.ok) return null
    const data = await res.json()
    const found = data.tournaments?.find((t: any) => t.status === "active")
    return found || null
  } catch {
    return null
  }
}

async function fetchLeaderboard(tournamentId: string, playerId?: string): Promise<LeaderboardData | null> {
  try {
    const url = playerId
      ? getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard/player/${playerId}`, SYNC_ENV)
      : getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard?page=1&limit=5`, SYNC_ENV)
    const res = await fetch(url, { cache: "no-store" })
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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  const { name, email, image, google_id } = session.user

  // Look up player by email first to support dynamic account switching by email address
  let dbPlayer = email ? await getPlayerByEmail(email) : null
  if (!dbPlayer && google_id) {
    dbPlayer = await getPlayerByGoogleId(google_id)
  }

  const resolvedName = dbPlayer?.name ?? name
  const firstName = resolvedName?.split(" ")[0] ?? "Player"
  const resolvedGoogleId = dbPlayer ? dbPlayer.google_id : google_id

  const [stats, gameplays, activeTournament] = await Promise.all([
    fetchStats(resolvedGoogleId),
    fetchGameplays(resolvedGoogleId),
    fetchActiveTournament(),
  ])

  const pid = dbPlayer ? dbPlayer._id.toString() : undefined
  const leaderboardData = activeTournament ? await fetchLeaderboard(activeTournament._id, pid) : null

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
      `}</style>

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
        <div className="border-b border-zinc-200/60 pb-5 mb-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-955 uppercase font-sans leading-none text-center">
            Welcome Back, {firstName}!
          </h1>
        </div>

        {/* ── Flat Responsive Layout: History -> Leaderboard -> Rewards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-start w-full pb-8">

          {/* 1. Available Rewards Card */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-indigo-400 bg-indigo-50/90 p-4 sm:p-6 min-h-[220px] shadow-[0_4px_20px_rgba(99,102,241,0.08)] w-full">
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

                  {activeTournament ? (
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
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500 leading-relaxed font-medium">
                      Compete in active tournaments to claim prizes. Sync scores to log your standing!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Tournament Leaderboard Card */}
          <Link
            href="/tournaments"
            className="group/leaderboardcard relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-pink-200/60 bg-pink-50/30 p-4 sm:p-6 shadow-[0_4px_24px_rgba(236,72,153,0.04)] transition-all duration-300 hover:border-pink-300/80 hover:bg-pink-50/60 hover:shadow-[0_8px_28px_rgba(236,72,153,0.08)] hover:-translate-y-0.5 w-full md:row-span-2"
          >
            {/* Hover Shine Sweep Overlay */}
            <div className="hover-shine-sweep opacity-0 group-hover/leaderboardcard:opacity-100 group-hover/leaderboardcard:animate-[hoverShineSweep_0.8s_ease-out_forwards]" />
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-pink-200/30">
                <span className="font-sans text-xs sm:text-sm font-black tracking-wide sm:tracking-[0.1em] text-pink-700 uppercase truncate">
                  {activeTournament?.name || "Active Tournament"}
                </span>
                <span className="font-mono text-[10px] sm:text-xs text-red-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="w-full text-center">
                <h3 className="text-sm sm:text-base font-bold text-zinc-800 transition-colors duration-300">
                  Tournament Leaderboard
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

                        let cardClass = "border-zinc-300 bg-zinc-100/40 hover:bg-zinc-100/60 shadow-sm"
                        let rankWidget = (
                          <div className={`font-mono text-sm sm:text-base font-black shrink-0 w-8 sm:w-10 text-left pl-1.5 ${isMe ? "text-orange-700" : "text-zinc-500"}`}>
                            {entry.rank}
                          </div>
                        )
                        let scoreColor = "text-zinc-600 font-extrabold"

                        if (isRank1) {
                          cardClass = "border-orange-400 bg-orange-100/45 hover:bg-orange-100/60 shadow-md border-l-4 border-l-orange-500"
                          rankWidget = (
                            <div className="text-xl shrink-0 w-8 sm:w-10 text-left select-none">
                              🥇
                            </div>
                          )
                          scoreColor = "text-orange-700 font-extrabold"
                        } else if (isRank2) {
                          cardClass = "border-sky-400 bg-sky-100/45 hover:bg-sky-100/60 shadow-sm"
                          rankWidget = (
                            <div className="text-xl shrink-0 w-8 sm:w-10 text-left select-none">
                              🥈
                            </div>
                          )
                          scoreColor = "text-sky-700 font-extrabold"
                        } else if (isRank3) {
                          cardClass = "border-indigo-400 bg-indigo-100/45 hover:bg-indigo-100/60 shadow-sm"
                          rankWidget = (
                            <div className="text-xl shrink-0 w-8 sm:w-10 text-left select-none">
                              🥉
                            </div>
                          )
                          scoreColor = "text-indigo-700 font-extrabold"
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
                            className={`relative flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-all duration-200 text-left ${cardClass}`}
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
                            <p className={`flex items-center flex-1 truncate text-xs sm:text-sm font-bold ${isMe ? "text-emerald-950" : "text-zinc-905"}`}>
                              <span className="truncate">
                                {entry.center?.name || entry.players.map(p => p?.name).filter(Boolean).join(", ") || "Unknown"}
                              </span>
                              {isRank1 && (
                                <Crown size={13} className="fill-orange-500 text-orange-600 shrink-0 ml-1.5 align-middle mb-0.5" />
                              )}
                            </p>

                            {/* Score */}
                            <p className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${scoreColor} leading-none flex items-center gap-1.5`}>
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
                ) : (
                  <p className="mt-2 text-xs text-zinc-500 leading-normal font-medium max-w-xs mx-auto">
                    No active standings yet. Sync scores to start the ladder.
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-pink-200/30" />

              {/* Performance Telemetry Block */}
              <div className="mb-6">
                <p className="font-sans text-[10px] sm:text-xs font-black tracking-widest text-pink-700 uppercase mb-2.5 text-center">
                  Your Performance Telemetry
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Games Played */}
                  <div className="flex flex-col items-center justify-center text-center rounded-xl border-2 border-cyan-300 bg-cyan-50 p-2 sm:p-3 shadow-xs">
                    <p className="text-base sm:text-lg md:text-xl font-black tracking-tight leading-tight text-cyan-950">
                      {stats?.games_played != null ? stats.games_played.toLocaleString() : "—"}
                    </p>
                    <p className="mt-1 font-mono text-[9px] sm:text-[10px] font-bold tracking-wider text-cyan-800 uppercase">
                      Games Played
                    </p>
                  </div>

                  {/* Best Score */}
                  <div className="flex flex-col items-center justify-center text-center rounded-xl border-2 border-amber-300 bg-amber-50 p-2 sm:p-3 shadow-xs">
                    <p className="text-base sm:text-lg md:text-xl font-black tracking-tight leading-tight text-amber-950">
                      {stats?.best_score != null ? stats.best_score.toLocaleString() : "—"}
                    </p>
                    <p className="mt-1 font-mono text-[9px] sm:text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                      Best Score
                    </p>
                  </div>

                  {/* Global Rank */}
                  <div className="flex flex-col items-center justify-center text-center rounded-xl border-2 border-indigo-300 bg-indigo-50 p-2 sm:p-3 shadow-xs">
                    <p className="text-base sm:text-lg md:text-xl font-black tracking-tight leading-tight text-indigo-950">
                      {stats?.global_rank != null ? `# ${stats.global_rank}` : "—"}
                    </p>
                    <p className="mt-1 font-mono text-[9px] sm:text-[10px] font-bold tracking-wider text-indigo-800 uppercase">
                      Global Rank
                    </p>
                  </div>
                </div>
              </div>

              {/* Enter Arena Nav Action Footer */}
              <div className="mt-6 pt-4 flex items-center justify-end border-t border-pink-200/40 relative z-20">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-pink-700 font-black tracking-wider px-3.5 py-1.5 rounded-full border border-pink-300 bg-pink-100/30 shadow-xs transition-all duration-300 group-hover/leaderboardcard:bg-pink-600 group-hover/leaderboardcard:text-white group-hover/leaderboardcard:border-pink-600 group-hover/leaderboardcard:shadow-[0_0_20px_rgba(236,72,153,0.55)] group-hover/leaderboardcard:translate-x-0.5">
                  ENTER ARENA <ChevronRight size={11} className="transition-transform group-hover/leaderboardcard:translate-x-0.5" />
                </span>
              </div>

            </div>
          </Link>

          {/* 3. Cabinet Session History Card */}
          <div className="relative flex flex-col justify-start overflow-hidden rounded-2xl border-2 border-stone-400 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgba(110,99,92,0.08)] min-h-[220px] w-full">
            <div className="mb-4 sm:mb-6 flex items-center justify-between border-b border-[#D9CFC7]/40 pb-3">
              <p className="font-mono text-xs sm:text-sm font-black tracking-wide sm:tracking-[0.25em] text-muted-foreground/60 uppercase">
                Cabinet Session History
              </p>
              <span className="font-mono text-xs text-muted-foreground/50 uppercase tracking-widest">
                Limit_10_Sess
              </span>
            </div>

            <div>
              {gameplays.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-6 sm:py-10 border border-dashed border-[#8a7f77]/40 rounded-xl bg-[#D9CFC7]/30 min-h-[120px] sm:min-h-[140px]">
                  <div className="p-3 sm:p-4 rounded-2xl bg-white/60 mb-3 sm:mb-4 inline-flex">
                    <QrCode size={24} className="text-orange-600 sm:size-7" />
                  </div>
                  <p className="text-sm font-bold text-[#443b35]">No synced sessions</p>
                  <p className="mt-1.5 max-w-[260px] text-xs text-[#6e635c] leading-relaxed px-4">
                    Sync your profile key at any active FOG arcade machine to register scores.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {sortedGameplays.map((g, index) => (
                    <div
                      key={`${g.gameplay_id}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-[#D9CFC7]/40 bg-[#D9CFC7]/20 p-3 sm:p-4 transition-all duration-300 hover:border-[#D9CFC7]/60 hover:bg-[#D9CFC7]/35"
                    >
                      {/* Date / Time */}
                      <div className="min-w-0 flex-1 text-left">
                        <p className="font-mono text-xs sm:text-sm font-bold text-zinc-900">
                          {new Date(g.played_at).toLocaleDateString(undefined, {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <p className="font-mono text-[10px] sm:text-xs text-zinc-500">
                            {new Date(g.played_at).toLocaleTimeString(undefined, {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                          {g.center_name && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200/50 font-mono text-[8px] sm:text-[9px] font-bold text-zinc-650 uppercase tracking-wider leading-none shadow-3xs">
                              {g.center_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="font-mono text-sm sm:text-base md:text-lg font-bold tabular-nums text-zinc-900">
                          {g.score.toLocaleString()}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] sm:text-xs text-[#6e635c] uppercase tracking-widest flex items-center gap-0.5 justify-end">
                          <ShieldCheck size={12} />
                          Synced
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
