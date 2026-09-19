import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Trophy,
  ChevronRight,
  Crown,
  ShieldCheck,
  QrCode,
  Users,
  Calendar,
  Clock,
} from "lucide-react"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { BackButton } from "@/components/BackButton"
import { SYNC_ENV, getUrlForEnv, getSyncOfflineStatus, setSyncOffline } from "@/lib/sync-env"
import { getPlayerByGoogleId, getPlayerByEmail } from "@/lib/players"
import { RewardsCarousel } from "@/components/RewardsCarousel"
import { LocalTime } from "@/components/LocalTime"
import type { Tournament, TournamentsResponse } from "@/types"

function getSyncUrl(): string {
  const url = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "http://192.168.1.45:4000"
  // If port 3000 was mistakenly specified for the sync server, fix to 4000
  if (url.endsWith(":3000")) {
    return url.replace(":3000", ":4000")
  }
  return url
}

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

async function fetchTournaments(env: string): Promise<Tournament[]> {
  try {
    const syncUrl = getSyncUrl()
    const res = await fetchWithTimeout(
      getUrlForEnv(`${syncUrl}/api/v1/tournaments?limit=50`, env),
      { cache: "no-store" }
    )
    if (!res.ok) return []
    const data: TournamentsResponse = await res.json()
    const list = data.tournaments ?? []
    if (list.length === 0 && env !== "dev") {
      // Graceful fallback to dev environment if prod has no active tournaments
      const fallbackRes = await fetchWithTimeout(
        getUrlForEnv(`${syncUrl}/api/v1/tournaments?limit=50`, "dev"),
        { cache: "no-store" }
      )
      if (fallbackRes.ok) {
        const fallbackData: TournamentsResponse = await fallbackRes.json()
        if (fallbackData.tournaments?.length) return fallbackData.tournaments
      }
    }
    return list
  } catch {
    return []
  }
}

async function fetchTournamentDetails(tournamentId: string, env: string): Promise<Tournament | null> {
  try {
    const syncUrl = getSyncUrl()
    const res = await fetchWithTimeout(
      getUrlForEnv(`${syncUrl}/api/v1/tournaments?limit=50`, env),
      { cache: "no-store" }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.tournaments?.find((t: Tournament) => t._id === tournamentId) ?? null
  } catch {
    return null
  }
}

async function fetchStats(googleId: string, env: string): Promise<PlayerStats | null> {
  try {
    const res = await fetchWithTimeout(
      getUrlForEnv(`${getSyncUrl()}/api/v1/player/${googleId}/stats`, env),
      { next: { revalidate: 3 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchGameplays(
  googleId: string,
  env: string,
  tournamentId?: string
): Promise<PlayerGameplay[]> {
  try {
    const query = tournamentId ? `tournament_id=${tournamentId}&limit=50` : `limit=10`
    const res = await fetchWithTimeout(
      getUrlForEnv(`${getSyncUrl()}/api/v1/player/${googleId}/gameplays?${query}`, env),
      { next: { revalidate: 3 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.gameplays ?? []
  } catch {
    return []
  }
}

async function fetchLeaderboard(
  tournamentId: string,
  env: string,
  playerId?: string
): Promise<LeaderboardData | null> {
  try {
    const url = playerId
      ? getUrlForEnv(`${getSyncUrl()}/api/v1/tournament/${tournamentId}/leaderboard/player/${playerId}`, env)
      : getUrlForEnv(`${getSyncUrl()}/api/v1/tournament/${tournamentId}/leaderboard?page=1&limit=5`, env)
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

// ── Tournament Card Component ─────────────────────────────────────────────────

function TournamentCard({ t, env, index }: { t: Tournament; env: string; index?: number }) {
  const href =
    env === "prod"
      ? `/dashboard?t=${t._id}`
      : `/dashboard?t=${t._id}&env=${env}`

  const isActive = t.status?.toLowerCase() === "active"

  const activePalette = {
    card: "glass-pill-3d !bg-gradient-to-br !from-amber-100/75 !to-orange-200/70 border border-orange-300 border-l-4 border-l-orange-500 shadow-[0_8px_24px_rgba(249,115,22,0.12)] scale-[1.01] hover:scale-[1.02] active:scale-[0.99] hover:shadow-[0_8px_30px_rgba(249,115,22,0.2)] z-10 transition-all duration-300 cursor-pointer",
    icon: "bg-orange-200/60 text-orange-700 shadow-sm border border-orange-300/50",
    badge: "text-orange-800 bg-orange-100/50 border border-orange-200/50 font-bold",
    badgeIcon: "text-orange-600",
    btn: "!bg-gradient-to-r !from-orange-300 !via-orange-200 !to-orange-300 border border-orange-400/60 shadow-sm hover:brightness-105",
  }

  const COLOR_PALETTES = [
    // Cyan / Blue
    {
      card: "glass-pill-3d !bg-cyan-200 border border-cyan-300 shadow-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
      icon: "bg-cyan-200/50 text-cyan-700 shadow-xs border border-cyan-300",
      badge: "text-cyan-700 bg-cyan-50/70 border border-cyan-200/40 font-bold",
      badgeIcon: "text-cyan-500",
      btn: "!bg-gradient-to-r !from-cyan-300/90 !via-sky-200 !to-cyan-300/90 border border-cyan-400/60 shadow-sm hover:brightness-105",
    },
    // Violet / Indigo
    {
      card: "glass-pill-3d !bg-indigo-200 border border-indigo-300 shadow-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
      icon: "bg-indigo-200/50 text-indigo-700 shadow-xs border border-indigo-300",
      badge: "text-indigo-700 bg-indigo-50/70 border border-indigo-200/40 font-bold",
      badgeIcon: "text-indigo-500",
      btn: "!bg-gradient-to-r !from-indigo-300/90 !via-violet-200 !to-indigo-300/90 border border-indigo-400/60 shadow-sm hover:brightness-105",
    },
    // Pink / Rose
    {
      card: "glass-pill-3d !bg-pink-200 border border-pink-300 shadow-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
      icon: "bg-pink-200/50 text-pink-700 shadow-xs border border-pink-300",
      badge: "text-pink-700 bg-pink-50/70 border border-pink-200/40 font-bold",
      badgeIcon: "text-pink-500",
      btn: "!bg-gradient-to-r !from-pink-300/90 !via-rose-200 !to-pink-300/90 border border-pink-400/60 shadow-sm hover:brightness-105",
    },
    // Emerald / Green
    {
      card: "glass-pill-3d !bg-emerald-200 border border-emerald-300 shadow-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
      icon: "bg-emerald-200/50 text-emerald-700 shadow-xs border border-emerald-300",
      badge: "text-emerald-700 bg-emerald-50/70 border border-emerald-200/40 font-bold",
      badgeIcon: "text-emerald-500",
      btn: "!bg-gradient-to-r !from-emerald-300/90 !via-teal-200 !to-emerald-300/90 border border-emerald-400/60 shadow-sm hover:brightness-105",
    },
  ]

  const palette = isActive
    ? activePalette
    : COLOR_PALETTES[(index ?? 0) % COLOR_PALETTES.length]

  const label =
    t.name ??
    new Date(t.started_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

  const startDate = new Date(t.started_at)
  const endDate = t.ended_at ? new Date(t.ended_at) : null

  const startYear = startDate.getFullYear()
  const endYear = endDate ? endDate.getFullYear() : null

  let dateRangeStr = ""
  if (endDate) {
    if (startYear === endYear) {
      const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      dateRangeStr = `${startStr} — ${endStr}`
    } else {
      const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      dateRangeStr = `${startStr} — ${endStr}`
    }
  } else {
    const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    dateRangeStr = `${startStr} — Active`
  }

  return (
    <Link
      href={href}
      className={`group/card relative flex items-start gap-3 sm:gap-4 rounded-2xl p-4 min-[390px]:p-4.5 sm:p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${palette.card}`}
    >
      {/* Left: Trophy Icon */}
      <div
        className={`flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl mt-0.5 ${palette.icon}`}
      >
        <Trophy size={19} className="sm:size-[21px]" />
      </div>

      {/* Right: All content lines aligned to the exact same starting point */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Line 1: Tournament Name & Player Count in one line */}
        <div className="flex items-center justify-between gap-2.5 w-full min-w-0">
          <span className="text-[15px] sm:text-base md:text-lg font-black text-zinc-955 truncate leading-tight min-w-0">
            {label}
          </span>

          <span className={`inline-flex items-center gap-1.5 font-mono px-2 py-0.5 rounded-md border ${palette.badge} whitespace-nowrap shrink-0 text-xs sm:text-sm`}>
            <Users size={12} className={palette.badgeIcon} />
            {t.player_count.toLocaleString()}
          </span>
        </div>

        {/* Line 2: Top Score & Button in one line (Top Score starts at same point as Tournament Name) */}
        <div className="flex items-center justify-between gap-3 mt-2.5 sm:mt-3 w-full min-w-0">
          <div>
            <p className="font-mono text-[9.5px] sm:text-[10px] text-[#6e635c] uppercase tracking-wider leading-none mb-1 font-semibold">
              Top Score
            </p>
            <p className="font-mono text-sm sm:text-base font-black tabular-nums text-zinc-900 leading-none">
              {t.top_score != null ? t.top_score.toLocaleString() : "—"}
            </p>
          </div>

          <div className="shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 group-hover/card:scale-105 shadow-xs ${palette.btn}`}
            >
              <span className="text-zinc-900 font-bold">{isActive ? "Enter Arena" : "View Results"}</span>
              <ChevronRight size={13} strokeWidth={2.5} className="transition-transform group-hover/card:translate-x-0.5 shrink-0 text-zinc-900" />
            </div>
          </div>
        </div>

        {/* Line 3: Date (starting point aligned with Tournament Name and Top Score) */}
        <div className="mt-2.5 sm:mt-3 text-xs text-[#6e635c] leading-none pt-0.5">
          <span className="inline-flex items-center gap-1.5 font-mono whitespace-nowrap text-zinc-700 text-[11px] sm:text-xs">
            <Calendar size={12} className="text-[#8a7f77]" />
            {dateRangeStr}
          </span>
        </div>
      </div>
    </Link>
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

  // Tournament selection query param: ?t=<id> or ?tournament_id=<id>
  const selectedTournamentId = Array.isArray(sp.t)
    ? sp.t[0]
    : sp.t ?? (Array.isArray(sp.tournament_id) ? sp.tournament_id[0] : sp.tournament_id)

  const { name, email, image, google_id } = session.user

  // Look up player by email first to support dynamic account switching by email address
  let dbPlayer = email ? await getPlayerByEmail(email) : null
  if (!dbPlayer && google_id) {
    dbPlayer = await getPlayerByGoogleId(google_id)
  }

  const resolvedName = dbPlayer?.name ?? name
  const firstName = resolvedName?.split(" ")[0] ?? "Player"
  const resolvedGoogleId = dbPlayer?.google_id || google_id
  const pid = dbPlayer ? dbPlayer._id.toString() : undefined

  // Fetch overall player statistics
  const stats = await fetchStats(resolvedGoogleId, env)

  // ── BRANCH 1: TOURNAMENT DETAILS VIEW (when a tournament is selected) ──────────
  if (selectedTournamentId) {
    const [selectedTournament, rawLeaderboardData, rawGameplays] = await Promise.all([
      fetchTournamentDetails(selectedTournamentId, env),
      fetchLeaderboard(selectedTournamentId, env, pid),
      fetchGameplays(resolvedGoogleId, env, selectedTournamentId),
    ])

    const activeTournament = selectedTournament
    const leaderboardData = rawLeaderboardData || { leaderboard: [], player: null }
    const gameplays = rawGameplays || []

    // Sort gameplays by date descending
    const sortedGameplays = [...gameplays].sort(
      (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
    )

    const hasActive = !!activeTournament
    const isTournamentCompleted =
      activeTournament?.status === "past" ||
      (activeTournament?.status as string) === "completed" ||
      Boolean(activeTournament?.ended_at && new Date(activeTournament.ended_at) < new Date())

    const activeGamesPlayed = hasActive
      ? leaderboardData?.player
        ? Math.max(1, sortedGameplays.filter((g) => g.tournament_id === activeTournament._id).length)
        : 0
      : stats?.games_played ?? 0

    const activeBestScore = hasActive
      ? leaderboardData?.player?.best_score ?? 0
      : stats?.best_score ?? 0

    const activeRank = hasActive
      ? leaderboardData?.player?.rank ?? null
      : stats?.global_rank ?? null

    const arenaHref =
      env === "prod"
        ? `/tournament/${selectedTournamentId}`
        : `/tournament/${selectedTournamentId}?env=${env}`

    return (
      <div className="min-h-screen flex flex-col bg-transparent text-zinc-900 relative overflow-hidden select-none">
        <style>{`
          @keyframes hoverShineSweep {
            0% { transform: translateX(-150%) skewX(-25deg); }
            100% { transform: translateX(350%) skewX(-25deg); }
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

        {/* Hero radial backlight glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] rounded-full bg-zinc-300/40 blur-[130px]"
        />

        {/* ── Sticky nav ── */}
        <header className="sticky top-0 z-50 border-b border-zinc-200/40 bg-white/80 backdrop-blur-xl shadow-sm transition-all">
          <Navbar name={resolvedName} image={dbPlayer?.avatar_url ?? image} />
        </header>

        {/* ── Back Navigation ── */}
        <div className="sticky top-[56px] z-30 bg-transparent py-3 mb-2">
          <div className="mx-auto w-full max-w-6xl px-4 flex justify-start">
            <BackButton forceHref="/dashboard" />
          </div>
        </div>

        {/* ── Main Dashboard Container ── */}
        <main className="relative z-10 mx-auto max-w-6xl px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 flex-grow w-full">
          {/* ── Tournament Header ── */}
          <div className="border-b border-zinc-200/60 pb-5 mb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-955 uppercase font-sans leading-none">
                {activeTournament?.name || "Tournament Arena"}
              </h1>
            </div>
          </div>

          {/* ── Flat Responsive Layout: Rewards -> Leaderboard -> History ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 md:gap-12 items-stretch w-full pb-8">
            {/* 1. Available Rewards Section */}
            <div className="space-y-6 w-full">
              <RewardsCarousel
                bannerUrl={activeTournament?.banner_url}
                rewards={activeTournament?.rewards}
                tournamentName={activeTournament?.name}
              />
            </div>

            {/* 2. Tournament Leaderboard Card */}
            <Link
              href={arenaHref}
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
                    <span className="inline-flex items-center justify-center gap-1.5 pl-3.5 pr-2.5 py-1.5 sm:pl-4 sm:pr-3 sm:py-2 rounded-full bg-pink-700/80 text-white border-pink-700/80 shadow-[0_4px_12px_rgba(190,24,74,0.18)] sm:bg-pink-50/50 sm:text-pink-700 sm:border-pink-200 sm:shadow-[0_2px_8px_rgba(190,24,74,0.08)] transition-all duration-300 group-hover/leaderboardcard:bg-pink-700/80 group-hover/leaderboardcard:text-white group-hover/leaderboardcard:border-pink-700/80 group-hover/leaderboardcard:shadow-[0_0_20px_rgba(190,24,74,0.35)] group-hover/leaderboardcard:translate-x-0.5 shrink-0">
                      <span className="font-mono text-[10.5px] sm:text-xs font-black uppercase tracking-wider">
                        {isTournamentCompleted ? "VIEW RESULTS" : "VIEW LEADERBOARD"}
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
                            const bestGameplay = gameplays.find(
                              (g) => g.score === leaderboardData.player!.best_score
                            )
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
                            const isMe = entry.rank === playerRank

                            let cardClass = "glass-pill-3d !bg-white/80 border-zinc-200 shadow-xs"
                            let rankWidget = (
                              <span className="font-mono text-base font-black shrink-0 w-6 sm:w-8 flex items-center justify-center text-zinc-500">
                                #{entry.rank}
                              </span>
                            )
                            let scoreColor = "text-zinc-700 font-bold"

                            if (isRank1) {
                              cardClass =
                                "glass-pill-3d !bg-none !bg-[#FFE082] md:hover:!bg-[#FFD54F] md:active:scale-[0.99] border-[#FFCA28] shadow-[0_8px_30px_rgba(255,179,0,0.22)] scale-[1.02] md:transition-transform md:duration-200 z-10"
                              rankWidget = (
                                <div className="text-xl shrink-0 w-6 sm:w-8 flex items-center justify-center select-none">
                                  🥇
                                </div>
                              )
                              scoreColor = "text-amber-900 font-black"
                            } else if (isRank2) {
                              cardClass =
                                "glass-pill-3d !bg-none !bg-[#B2DCFF] md:hover:!bg-[#9ECEFF] md:active:scale-[0.99] border-[#4FC3F7] shadow-[0_8px_30px_rgba(3,169,244,0.18)] scale-[1.01] md:transition-transform md:duration-200 z-10"
                              rankWidget = (
                                <div className="text-xl shrink-0 w-6 sm:w-8 flex items-center justify-center select-none">
                                  🥈
                                </div>
                              )
                              scoreColor = "text-sky-800 font-extrabold"
                            } else if (isRank3) {
                              cardClass =
                                "glass-pill-3d !bg-none !bg-[#D8CFFF] md:hover:!bg-[#C8BAFF] md:active:scale-[0.99] border-[#9FA8DA] shadow-[0_8px_30px_rgba(99,102,241,0.18)] scale-[1.01] md:transition-transform md:duration-200 z-10"
                              rankWidget = (
                                <div className="text-xl shrink-0 w-6 sm:w-8 flex items-center justify-center select-none">
                                  🥉
                                </div>
                              )
                              scoreColor = "text-indigo-800 font-extrabold"
                            }

                            if (isMe) {
                              if (!isRank1 && !isRank2 && !isRank3) {
                                cardClass =
                                  "glass-pill-3d liquid-card-bg border-emerald-500 shadow-md border-2 transition-all duration-300 relative"
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
                                {rankWidget}

                                <div className="size-8 shrink-0 overflow-hidden rounded-full bg-zinc-200 border border-zinc-300/60 shadow-sm relative">
                                  {isMe && (
                                    <span className="absolute inset-0 rounded-full border-2 border-emerald-500/80 animate-pulse pointer-events-none" />
                                  )}
                                  <Avatar
                                    src={entry.players[0]?.avatar_url ?? ""}
                                    name={
                                      entry.players.map((p) => p?.name).filter(Boolean).join(", ") ||
                                      entry.center?.name ||
                                      "?"
                                    }
                                  />
                                </div>

                                <div className="flex-1 min-w-0 flex items-center gap-1.5 pr-1">
                                  <span
                                    className={`text-base font-bold truncate leading-tight ${isMe ? "text-emerald-950" : "text-zinc-905"
                                      }`}
                                  >
                                    {entry.players.map((p) => p?.name).filter(Boolean).join(", ") ||
                                      entry.center?.name ||
                                      "Unknown"}
                                  </span>
                                  {isRank1 && (
                                    <Crown
                                      size={14}
                                      className="fill-orange-500 text-orange-600 shrink-0"
                                    />
                                  )}
                                </div>

                                <div
                                  className={`font-mono text-base font-bold tabular-nums ${scoreColor} leading-none flex items-center justify-start gap-0.5 min-w-[80px] pl-3 shrink-0`}
                                >
                                  <div className="w-3.5 flex items-center justify-start shrink-0">
                                    {isRank1 && (
                                      <Trophy size={14} className="fill-amber-400 text-amber-500 shrink-0" />
                                    )}
                                    {isRank2 && (
                                      <Trophy size={14} className="fill-slate-300 text-slate-400 shrink-0" />
                                    )}
                                    {isRank3 && (
                                      <Trophy size={14} className="fill-orange-400 text-orange-500 shrink-0" />
                                    )}
                                  </div>
                                  <span className="text-left">{entry.score.toLocaleString()}</span>
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
                        {activeGamesPlayed.toLocaleString()}
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold tracking-wider text-cyan-800 uppercase leading-snug">
                        Games<br />Played
                      </p>
                    </div>

                    {/* Best Score */}
                    <div className="glass-pill-3d !bg-amber-200 border border-amber-300 shadow-[0_4px_12px_rgba(245,158,11,0.08)] flex flex-col items-center justify-start text-center rounded-xl p-3 sm:p-4 w-full">
                      <p className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-amber-955">
                        {activeBestScore.toLocaleString()}
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold tracking-wider text-amber-800 uppercase leading-snug">
                        Best<br />Score
                      </p>
                    </div>

                    {/* Rank */}
                    <div className="glass-pill-3d !bg-indigo-200 border border-indigo-300 shadow-[0_4px_12px_rgba(99,102,241,0.08)] flex flex-col items-center justify-start text-center rounded-xl p-3 sm:p-4 w-full">
                      <p className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-indigo-950">
                        {activeRank ? `# ${activeRank}` : "# 0"}
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold tracking-wider text-indigo-800 uppercase leading-snug">
                        Rank
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
                    <p className="text-base font-black text-[#3c342f] tracking-tight">No sessions for this tournament</p>
                    <p className="mt-2 max-w-[320px] text-sm text-[#5d534c] leading-relaxed px-4 mx-auto">
                      Scan your QR code at any active FOG machine running this tournament to log plays.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 sm:space-y-3 max-h-[300px] overflow-y-auto px-3.5 py-3.5 scrollbar-thin">
                    {sortedGameplays.slice(0, 10).map((g, index) => (
                      <div
                        key={`${g.gameplay_id}-${index}`}
                        className="glass-pill-3d !bg-gradient-to-br !from-pink-200/40 !to-violet-200/40 border border-pink-300/60 relative flex items-center justify-between rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-xs"
                      >
                        <div className="min-w-0 flex-1 text-left">
                          <p className="font-mono text-base font-bold text-zinc-900 uppercase tracking-wide">
                            {g.center_name || resolvedName || "FOG Cabinet"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <p className="font-mono text-sm text-zinc-500">
                              <LocalTime isoString={g.played_at} type="time" />
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-mono text-lg font-bold tabular-nums text-zinc-900">
                            {g.score.toLocaleString()}
                          </p>
                          <p className="mt-0.5 font-mono text-sm text-[#6e635c] uppercase tracking-widest flex items-center gap-0.5 justify-end">
                            <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                            <span>
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

        <footer className="relative z-10 border-t border-zinc-200/50 py-3 bg-zinc-50/50 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-6 flex flex-col-reverse md:flex-row items-center justify-between gap-1.5 font-mono text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider">
            <span className="opacity-80">© {new Date().getFullYear()} FOG Technologies Pvt. Ltd.</span>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-orange-500 hover:scale-[1.02] transition-all duration-200 py-1 relative group">
                Privacy Policy
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-orange-500 transition-all duration-350 group-hover:w-full" />
              </Link>
              <Link href="/terms" className="hover:text-orange-500 hover:scale-[1.02] transition-all duration-200 py-1 relative group">
                Terms & Conditions
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-orange-500 transition-all duration-350 group-hover:w-full" />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // ── BRANCH 2: TOURNAMENTS SELECTION VIEW (Default Home / Dashboard) ─────────────
  const tournaments = await fetchTournaments(env)
  const active = tournaments.filter((t) => t.status?.toLowerCase() === "active")
  const past = tournaments.filter((t) => t.status?.toLowerCase() !== "active")

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

      {/* Hero radial backlight glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] rounded-full bg-zinc-300/40 blur-[130px]"
      />

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/40 bg-white/80 backdrop-blur-xl shadow-sm transition-all">
        <Navbar name={resolvedName} image={dbPlayer?.avatar_url ?? image} />
      </header>

      {/* ── Main Tournaments Selection Container ── */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:py-12 space-y-6 sm:space-y-8 flex-grow w-full">
        {/* ── Welcome Header & Player Summary ── */}
        <div className="border-b border-zinc-200/60 pb-5 mb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-955 uppercase font-sans leading-none text-center sm:text-left">
              Welcome Back, {firstName}!
            </h1>
          </div>

          {/* Player stats summary chips */}
          <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap">
            <div className="glass-pill-3d !bg-cyan-100/70 border border-cyan-300 px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-800 uppercase tracking-wider">Played:</span>
              <span className="font-mono text-sm font-black text-cyan-950">{(stats?.games_played ?? 0).toLocaleString()}</span>
            </div>
            <div className="glass-pill-3d !bg-amber-100/70 border border-amber-300 px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-800 uppercase tracking-wider">Best:</span>
              <span className="font-mono text-sm font-black text-amber-950">{(stats?.best_score ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Arenas Panels ── */}
        {tournaments.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center text-center py-12 border border-dashed border-[#8a7f77]/40 rounded-xl bg-[#D9CFC7]/30 min-h-[160px] max-w-md mx-auto">
            <div className="p-3 rounded-2xl bg-white/60 mb-3 inline-flex border border-[#D9CFC7]/30 shadow-sm">
              <Trophy size={26} className="text-orange-600" />
            </div>
            <p className="text-base font-bold text-[#443b35]">No tournaments yet</p>
            <p className="mt-1.5 max-w-[280px] text-xs text-[#6e635c] leading-relaxed px-4">
              Tournaments will appear here once active. Scan a QR code at any FOG arcade machine to register scores.
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Active Arenas Panel */}
            {active.length > 0 && (
              <div className="glass-panel-3d relative flex flex-col overflow-hidden !bg-white/10 !border-[#D9CFC7]/50 p-4 sm:p-6 transition-all duration-300">
                <div className="mb-4 flex items-center justify-between border-b border-[#D9CFC7]/40 pb-3">
                  <p className="font-mono text-base font-black tracking-wide sm:tracking-[0.25em] text-[#6e635c] uppercase flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping"></span>
                    Active Arenas
                  </p>
                  <span className="font-mono text-sm text-red-500 font-bold uppercase flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    {active.length}
                    <span className="tracking-widest ml-1">Live</span>
                  </span>
                </div>

                <div className="space-y-3">
                  {active.map((t) => (
                    <TournamentCard key={t._id} t={t} env={env} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tournaments Panel */}
            {past.length > 0 && (
              <div className="glass-panel-3d relative flex flex-col overflow-hidden !bg-white/10 !border-[#D9CFC7]/50 p-4 sm:p-6 transition-all duration-300">
                <div className="mb-4 flex items-center justify-between border-b border-[#D9CFC7]/40 pb-3">
                  <p className="font-mono text-base font-black tracking-wide sm:tracking-[0.25em] text-[#6e635c] uppercase flex items-center gap-2">
                    <Clock size={14} className="text-[#8a7f77]" />
                    Completed Tournaments
                  </p>
                  <span className="font-mono text-sm text-muted-foreground/50 uppercase">
                    {past.length}
                    <span className="tracking-widest ml-1">Completed</span>
                  </span>
                </div>

                <div className="space-y-3">
                  {past.map((t, idx) => (
                    <TournamentCard key={t._id} t={t} env={env} index={idx} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-zinc-200/50 py-3 bg-zinc-50/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 flex flex-col-reverse md:flex-row items-center justify-between gap-1.5 font-mono text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider">
          <span className="opacity-80">© {new Date().getFullYear()} FOG Technologies Pvt. Ltd.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-orange-500 hover:scale-[1.02] transition-all duration-200 py-1 relative group">
              Privacy Policy
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-orange-500 transition-all duration-350 group-hover:w-full" />
            </Link>
            <Link href="/terms" className="hover:text-orange-500 hover:scale-[1.02] transition-all duration-200 py-1 relative group">
              Terms & Conditions
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-orange-500 transition-all duration-350 group-hover:w-full" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
