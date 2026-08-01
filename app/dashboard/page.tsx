import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { QrCode, Gamepad2, Trophy, Star, ChevronRight, Cpu, Activity, ShieldCheck, Gift, Crown } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { SYNC_ENV, getUrlForEnv } from "@/lib/sync-env"

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
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
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

async function fetchLeaderboard(tournamentId: string): Promise<LeaderboardData | null> {
  try {
    const res = await fetch(
      getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/leaderboard?page=1&limit=5`, SYNC_ENV),
      { cache: "no-store" }
    )
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
  const firstName = name?.split(" ")[0] ?? "Player"

  const [stats, gameplays, activeTournament] = await Promise.all([
    fetchStats(google_id),
    fetchGameplays(google_id),
    fetchActiveTournament(),
  ])

  const leaderboardData = activeTournament ? await fetchLeaderboard(activeTournament._id) : null

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
        <Navbar name={name} image={image} />
      </header>

      {/* ── Main Dashboard Container ── */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:py-12 space-y-6 sm:space-y-8 flex-grow w-full">

        {/* ── Simple Welcome Header (Clean text, no card) ── */}
        <div className="border-b border-zinc-200/60 pb-5 mb-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-955 uppercase font-sans leading-none">
            Welcome Back, {firstName}!
          </h1>
        </div>

        {/* ── Flat Responsive Layout: Rewards -> Leaderboard -> History ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start w-full">
          
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
                  
                  {activeTournament?.rewards && (activeTournament.rewards.bannerUrl || activeTournament.rewards.top3Urls?.first || activeTournament.rewards.top3Urls?.second || activeTournament.rewards.top3Urls?.third) ? (
                    <div className="mt-3.5">
                      {activeTournament.rewards.type === "banner" ? (
                        <div className="relative w-full h-[180px] rounded-xl overflow-hidden shadow-inner border border-zinc-100 bg-zinc-950">
                          <Image
                            src={activeTournament.rewards.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800"}
                            alt="Rewards Banner"
                            fill
                            sizes="(max-w-xl) 50vw, 400px"
                            className="object-cover opacity-85"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                            <span className="w-fit px-1.5 py-0.5 rounded bg-orange-500/90 text-white font-mono text-[8px] font-black uppercase tracking-widest mb-1 shadow-sm">
                              Grand Prize Reward
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 pt-1.5">
                          {/* 2nd Place */}
                          {activeTournament.rewards.top3Urls?.second && (
                            <div className="flex flex-col items-center border border-zinc-200/60 bg-white/60 rounded-xl p-2 shadow-xs">
                              <div className="relative w-full aspect-square max-h-[70px] rounded-lg overflow-hidden bg-white border border-zinc-150 mb-1">
                                <Image
                                  src={activeTournament.rewards.top3Urls.second}
                                  alt="2nd Prize"
                                  fill
                                  sizes="100px"
                                  className="object-contain p-1"
                                />
                              </div>
                              <span className="text-[8px] font-black text-zinc-850 uppercase truncate w-full text-center">
                                #2 Prize
                              </span>
                            </div>
                          )}

                          {/* 1st Place */}
                          {activeTournament.rewards.top3Urls?.first && (
                            <div className="flex flex-col items-center border-2 border-amber-300 bg-amber-50/20 rounded-xl p-2 shadow-xs relative">
                              <div className="relative w-full aspect-square max-h-[75px] rounded-lg overflow-hidden bg-white border border-amber-100 mb-1">
                                <Image
                                  src={activeTournament.rewards.top3Urls.first}
                                  alt="1st Prize"
                                  fill
                                  sizes="100px"
                                  className="object-contain p-1"
                                />
                              </div>
                              <span className="text-[8px] font-black text-amber-850 uppercase truncate w-full text-center">
                                Champion
                              </span>
                            </div>
                          )}

                          {/* 3rd Place */}
                          {activeTournament.rewards.top3Urls?.third && (
                            <div className="flex flex-col items-center border border-zinc-200/60 bg-white/60 rounded-xl p-2 shadow-xs">
                              <div className="relative w-full aspect-square max-h-[70px] rounded-lg overflow-hidden bg-white border border-zinc-150 mb-1">
                                <Image
                                  src={activeTournament.rewards.top3Urls.third}
                                  alt="3rd Prize"
                                  fill
                                  sizes="100px"
                                  className="object-contain p-1"
                                />
                              </div>
                              <span className="text-[8px] font-black text-zinc-850 uppercase truncate w-full text-center">
                                #3 Prize
                              </span>
                            </div>
                          )}
                        </div>
                      )}
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
            className="group/leaderboardcard relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-pink-500 bg-pink-50/95 p-4 sm:p-6 shadow-[0_4px_24px_rgba(236,72,153,0.1)] transition-all duration-300 hover:border-pink-600 hover:bg-pink-100/95 hover:shadow-[0_8px_28px_rgba(236,72,153,0.18)] hover:-translate-y-0.5 w-full md:row-span-2"
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
                    {leaderboardData.leaderboard.slice(0, 3).map((entry) => {
                      const isRank1 = entry.rank === 1
                      const isRank2 = entry.rank === 2
                      const isRank3 = entry.rank === 3

                      let cardClass = "border-pink-300 bg-pink-100/40 hover:bg-pink-100/60 shadow-sm"
                      let rankWidget = null
                      let scoreColor = "text-zinc-900"

                      if (isRank1) {
                        cardClass = "border-amber-400 bg-amber-100/45 hover:bg-amber-100/60 shadow-md border-l-4 border-l-amber-500"
                        rankWidget = (
                          <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                            #1
                          </div>
                        )
                        scoreColor = "text-amber-750 font-extrabold"
                      } else if (isRank2) {
                        cardClass = "border-indigo-400 bg-indigo-100/45 hover:bg-indigo-100/60 shadow-sm"
                        rankWidget = (
                          <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200">
                            #2
                          </div>
                        )
                        scoreColor = "text-indigo-700 font-extrabold"
                      } else if (isRank3) {
                        cardClass = "border-orange-400/80 bg-orange-100/35 hover:bg-orange-100/50 shadow-sm"
                        rankWidget = (
                          <div className="flex size-7 shrink-0 items-center justify-center font-mono text-xs font-bold rounded-lg bg-orange-100 text-amber-850 border border-orange-200/40">
                            #3
                          </div>
                        )
                        scoreColor = "text-amber-800 font-extrabold"
                      }

                      return (
                        <div
                          key={entry.rank}
                          className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-all duration-200 text-left ${cardClass}`}
                        >
                          {/* Rank Widget */}
                          {rankWidget}

                          {/* Avatar */}
                          <div className="size-8 shrink-0 overflow-hidden rounded-full bg-zinc-200 border border-zinc-300/60 shadow-sm relative">
                            <Avatar
                              src={entry.players[0]?.avatar_url ?? ""}
                              name={entry.players[0]?.name ?? "?"}
                            />
                          </div>

                          {/* Name */}
                          <p className="flex items-center flex-1 truncate text-xs sm:text-sm font-bold text-zinc-905">
                            <span className="truncate">{entry.players[0]?.name ?? "Unknown"}</span>
                            {isRank1 && (
                              <Crown size={13} className="fill-amber-500 text-amber-600 shrink-0 ml-1.5 align-middle mb-0.5" />
                            )}
                          </p>

                          {/* Score */}
                          <p className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${scoreColor} leading-none`}>
                            {entry.score.toLocaleString()}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500 leading-normal font-medium max-w-xs mx-auto">
                    No active standings yet. Sync scores to start the ladder.
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="my-4 border-t border-pink-200/30" />

              {/* Performance Telemetry Block */}
              <div>
                <p className="font-sans text-[10px] sm:text-xs font-black tracking-widest text-pink-700 uppercase mb-2.5 text-center">
                  Your Performance Telemetry
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Games Played */}
                  <div className="flex flex-col items-center justify-center text-center rounded-xl border border-cyan-200 bg-cyan-50/80 p-2.5 sm:p-3.5">
                    <p className="text-sm sm:text-base md:text-lg font-black tracking-tight leading-none text-cyan-900">
                      {stats?.games_played != null ? stats.games_played.toLocaleString() : "—"}
                    </p>
                    <p className="mt-1 font-mono text-[8px] sm:text-[9px] font-black tracking-wider text-cyan-700 uppercase">
                      Games Played
                    </p>
                  </div>

                  {/* Best Score */}
                  <div className="flex flex-col items-center justify-center text-center rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 sm:p-3.5">
                    <p className="text-sm sm:text-base md:text-lg font-black tracking-tight leading-none text-amber-900">
                      {stats?.best_score != null ? stats.best_score.toLocaleString() : "—"}
                    </p>
                    <p className="mt-1 font-mono text-[8px] sm:text-[9px] font-black tracking-wider text-amber-700 uppercase">
                      Best Score
                    </p>
                  </div>

                  {/* Global Rank */}
                  <div className="flex flex-col items-center justify-center text-center rounded-xl border border-indigo-200 bg-indigo-50/80 p-2.5 sm:p-3.5">
                    <p className="text-sm sm:text-base md:text-lg font-black tracking-tight leading-none text-indigo-900">
                      {stats?.global_rank != null ? `#${stats.global_rank}` : "—"}
                    </p>
                    <p className="mt-1 font-mono text-[8px] sm:text-[9px] font-black tracking-wider text-indigo-700 uppercase">
                      Global Rank
                    </p>
                  </div>
                </div>
              </div>



              {/* Enter Arena Nav Action Footer */}
              <div className="mt-5 pt-3.5 flex items-center justify-end border-t border-pink-200/40 relative z-20">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-pink-700 font-black tracking-wider px-3.5 py-1.5 rounded-full border border-pink-300 bg-pink-100/30 shadow-xs transition-all duration-300 group-hover/leaderboardcard:bg-pink-600 group-hover/leaderboardcard:text-white group-hover/leaderboardcard:border-pink-600 group-hover/leaderboardcard:shadow-[0_0_20px_rgba(236,72,153,0.55)] group-hover/leaderboardcard:translate-x-0.5">
                  ENTER ARENA <ChevronRight size={11} className="transition-transform group-hover/leaderboardcard:translate-x-0.5" />
                </span>
              </div>

            </div>
          </Link>

          {/* 3. Cabinet Session History Card */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-stone-400 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgba(110,99,92,0.08)] min-h-[220px] w-full">
            <div className="mb-4 sm:mb-6 flex items-center justify-between border-b border-[#D9CFC7]/40 pb-3">
              <p className="font-mono text-xs sm:text-sm font-bold tracking-wide sm:tracking-[0.25em] text-muted-foreground/60 uppercase">
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
                  {gameplays.map((g) => (
                    <div
                      key={g.gameplay_id}
                      className="flex items-center justify-between rounded-xl border border-[#D9CFC7]/40 bg-[#D9CFC7]/20 p-3 sm:p-4 transition-all duration-300 hover:border-[#D9CFC7]/60 hover:bg-[#D9CFC7]/35"
                    >
                      {/* Date / Time */}
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs sm:text-sm font-bold text-zinc-900">
                          {new Date(g.played_at).toLocaleDateString(undefined, {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] sm:text-xs text-zinc-500">
                          {new Date(g.played_at).toLocaleTimeString(undefined, {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
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
