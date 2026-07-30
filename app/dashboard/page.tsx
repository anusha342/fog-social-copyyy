import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { QrCode, Gamepad2, Trophy, Star, ChevronRight, Cpu, Activity, ShieldCheck } from "lucide-react"
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

  const [stats, gameplays] = await Promise.all([
    fetchStats(google_id),
    fetchGameplays(google_id),
  ])

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

      {/* ── Main Dashboard grid container ── */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16 space-y-6 sm:space-y-8 flex-grow w-full">

        {/* ── ROW 1: Profile Card & Tournaments Arena Card (Side-by-Side) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-stretch">

          {/* 1. Player Pass Card */}
          <div className="relative p-[1.5px] rounded-2xl overflow-hidden bg-no-repeat animate-shimmer-slide shadow-[0_2px_12px_rgba(162,196,183,0.12)] hover:shadow-[0_4px_20px_rgba(162,196,183,0.22)] hover:-translate-y-1 transition-all duration-300"
            style={{ background: "linear-gradient(90deg, transparent 0%, #ffffff 30%, #a7f3d0 50%, #ffffff 70%, transparent 100%)", backgroundColor: "#a2c4b7" }}>
            <div className="w-full h-full rounded-[14px] bg-[#e6efeb] p-4 sm:p-6 flex flex-col justify-center">
              {/* Profile Card Body */}
              <div className="py-4 sm:py-8 text-center flex flex-col items-center justify-center">

                {/* Avatar */}
                <div className="relative mb-4 sm:mb-5 cursor-pointer">
                  <div className="size-16 sm:size-20 overflow-hidden rounded-full border-2 border-[#BED4CB]/50 bg-white p-1">
                    <div className="size-full overflow-hidden rounded-full relative bg-zinc-100">
                      {image ? (
                        <Image
                          src={image}
                          alt=""
                          width={80}
                          height={80}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-2xl sm:text-3xl font-black text-[#335c49]">
                          {name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="font-sans text-lg sm:text-xl md:text-2xl tracking-wide sm:tracking-[0.25em] text-[#5e8b76] font-black uppercase">
                  Welcome back
                </p>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight mt-1.5 text-[#335c49] uppercase font-sans">
                  {firstName}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600/80 font-semibold mt-2 font-mono truncate w-full max-w-[240px] sm:max-w-none px-2">{email}</p>
              </div>
            </div>
          </div>

          {/* 2. Tournament Arena Card (Directly aligned with profile card) */}
          <div className="flex flex-col">
            <Link
              href="/tournaments"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-pink-400/80 bg-pink-100/45 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 hover:border-pink-500 hover:bg-pink-100/60 md:hover:shadow-[0_8px_24px_rgba(236,72,153,0.22)] md:hover:-translate-y-1 flex-1 min-h-[250px] sm:min-h-[300px]"
            >
              <div>
                <div className="flex items-center justify-end pb-3 mb-3 sm:mb-4">
                  <span className="font-mono text-xs text-red-500 font-bold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 pt-4 sm:pt-6">
                  <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 text-white shadow-[0_4px_12px_rgba(236,72,153,0.25)] transition-all duration-300 group-hover:scale-110">
                    <Trophy size={18} className="sm:size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-800 group-hover:text-pink-500 transition-colors duration-300">
                      Tournament Arena
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-zinc-500 leading-relaxed transition-colors duration-300 group-hover:text-muted-foreground/75 font-medium">
                      Enter active bracket pools, climb ranks, and challenge regional cabinets. Secure your hi-score rankings on verified local cabinets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 flex items-center justify-end font-mono text-xs text-zinc-700 font-bold tracking-wider transition-colors duration-300 group-hover:text-pink-400">
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  ENTER ARENA <ChevronRight size={12} />
                </span>
              </div>

            </Link>
          </div>

        </div>

        {/* ── ROW 2: Performance Telemetry (Horizontal Stats Grid Wrapped in One Frame) ── */}
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">

          <div className="mb-4 sm:mb-6 flex items-center justify-between border-b border-zinc-100 pb-3">
            <p className="font-mono text-xs sm:text-sm font-bold tracking-wide sm:tracking-[0.25em] text-muted-foreground/60 uppercase">
              Performance Telemetry
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {statCards.map(({ label, value, Icon, iconClass, valueClass, cardBaseClass, shimmerBg }) => (
              <div
                key={label}
                className={`relative flex flex-col items-center justify-center text-center overflow-hidden rounded-2xl border p-4 sm:p-6 md:p-8 ${cardBaseClass}`}
              >
                <ShimmerEdge background={shimmerBg} />

                <div className={`p-2.5 sm:p-3 rounded-xl mb-3 sm:mb-4 ${iconClass}`}>
                  <Icon size={18} className="sm:size-5" />
                </div>
                <p className={`text-3xl sm:text-4xl font-black tracking-tight ${valueClass}`}>
                  {value}
                </p>
                <p className="mt-1.5 sm:mt-2 font-mono text-[10px] sm:text-xs tracking-widest text-muted-foreground/60 uppercase">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#8a7f77] bg-white p-4 sm:p-6 shadow-[0_2px_12px_rgba(110,99,92,0.12)] min-h-[220px]">
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
