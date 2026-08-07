import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Trophy, Users, Calendar, ChevronRight, Clock } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { BackButton } from "@/components/BackButton"
import { SYNC_ENV, getUrlForEnv } from "@/lib/sync-env"
import type { Tournament, TournamentsResponse } from "@/types"

const SYNC = process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? ""

async function fetchTournaments(): Promise<Tournament[]> {
  try {
    const res = await fetch(
      getUrlForEnv(`${SYNC}/api/v1/tournaments?limit=50`, SYNC_ENV),
      { cache: "no-store" }
    )
    if (!res.ok) return []
    const data: TournamentsResponse = await res.json()
    return data.tournaments ?? []
  } catch {
    return []
  }
}

function TournamentCard({ t, env, mock, index }: { t: Tournament; env: string; mock?: boolean; index?: number }) {
  const href =
    env === "prod"
      ? `/tournament/${t._id}${mock ? "?mock=true" : ""}`
      : `/tournament/${t._id}?env=${env}${mock ? "&mock=true" : ""}`

  const isActive = t.status === "active"

  const activePalette = {
    card: "glass-pill-3d !bg-gradient-to-br !from-amber-100/75 !to-orange-200/70 border border-orange-300 border-l-4 border-l-orange-500 shadow-[0_8px_24px_rgba(249,115,22,0.12)] scale-[1.01] hover:scale-[1.02] active:scale-[0.99] hover:shadow-[0_8px_30px_rgba(249,115,22,0.2)] z-10 transition-all duration-300",
    icon: "bg-orange-200/60 text-orange-700 shadow-sm border border-orange-300/50",
    badge: "text-orange-800 bg-orange-100/50 border border-orange-200/50 font-bold",
    badgeIcon: "text-orange-600",
  }

  const COLOR_PALETTES = [
    // Cyan / Blue
    {
      card: "glass-pill-3d !bg-cyan-200 border border-cyan-300 shadow-sm transition-all duration-200",
      icon: "bg-cyan-200/50 text-cyan-700 shadow-xs border border-cyan-300",
      badge: "text-cyan-700 bg-cyan-50/70 border border-cyan-200/40 font-bold",
      badgeIcon: "text-cyan-500",
    },
    // Violet / Indigo
    {
      card: "glass-pill-3d !bg-indigo-200 border border-indigo-300 shadow-sm transition-all duration-200",
      icon: "bg-indigo-200/50 text-indigo-700 shadow-xs border border-indigo-300",
      badge: "text-indigo-700 bg-indigo-50/70 border border-indigo-200/40 font-bold",
      badgeIcon: "text-indigo-500",
    },
    // Pink / Rose
    {
      card: "glass-pill-3d !bg-pink-200 border border-pink-300 shadow-sm transition-all duration-200",
      icon: "bg-pink-200/50 text-pink-700 shadow-xs border border-pink-300",
      badge: "text-pink-700 bg-pink-50/70 border border-pink-200/40 font-bold",
      badgeIcon: "text-pink-500",
    },
    // Emerald / Green
    {
      card: "glass-pill-3d !bg-emerald-200 border border-emerald-300 shadow-sm transition-all duration-200",
      icon: "bg-emerald-200/50 text-emerald-700 shadow-xs border border-emerald-300",
      badge: "text-emerald-700 bg-emerald-50/70 border border-emerald-200/40 font-bold",
      badgeIcon: "text-emerald-500",
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
      className={`relative flex items-center justify-between rounded-xl p-4 min-[390px]:p-4.5 sm:p-5 overflow-hidden ${palette.card}`}
    >

      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-2">
        {/* Icon */}
        <div
          className={`flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl ${palette.icon}`}
        >
          <Trophy size={18} className="sm:size-[20px]" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[15px] sm:text-base md:text-lg font-black text-zinc-955 whitespace-normal break-words leading-tight shrink">
              {label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs sm:text-sm text-[#6e635c] leading-none">
            <span className={`inline-flex items-center gap-1 font-mono px-1.5 py-0.5 rounded border ${palette.badge} whitespace-nowrap shrink-0`}>
              <Users size={12} className={palette.badgeIcon} />
              {t.player_count.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 font-mono whitespace-nowrap shrink-0">
              <Calendar size={12} className="text-[#8a7f77]" />
              {dateRangeStr}
            </span>
          </div>
        </div>
      </div>

      {/* Top score + arrow */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3 ml-auto">

        {t.top_score != null && (
          <div className="text-right">
            <p className="font-mono text-[10px] sm:text-xs text-[#6e635c]/80 uppercase tracking-widest leading-none mb-1 hidden min-[390px]:block">Top Score</p>
            <p className="font-mono text-base sm:text-lg font-bold tabular-nums text-zinc-900 leading-none">
              {t.top_score.toLocaleString()}
            </p>
          </div>
        )}
        <ChevronRight size={16} className="text-[#8a7f77]" />
      </div>
    </Link>
  )
}

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  const sp = await searchParams
  const env = Array.isArray(sp.env) ? sp.env[0] : (sp.env ?? SYNC_ENV)
  const mockParam = Array.isArray(sp.mock) ? sp.mock[0] : sp.mock
  const isMockEnabled = mockParam !== "false"

  const tournaments = await fetchTournaments()
  const active = tournaments.filter((t) => t.status === "active")
  const past = tournaments.filter((t) => t.status === "past")

  const summary =
    tournaments.length > 0
      ? `${tournaments.length} tournament${tournaments.length !== 1 ? "s" : ""}${active.length > 0 ? ` · ${active.length} live` : ""}`
      : "Browse active and past competitions"

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
      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/40 bg-white/80 backdrop-blur-xl shadow-sm">
        <Navbar name={session.user.name} image={session.user.image} />
      </header>

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

      {/* ── Back Navigation Wrapper (Sticky below Navbar) ── */}
      <div className="sticky top-[56px] z-30 bg-transparent py-3 mb-2">
        <div className="mx-auto w-full max-w-6xl px-4 flex justify-start">
          <BackButton />
        </div>
      </div>

      {/* ── Simple Title Header (Clean text, no card) ── */}
      <div className="border-b border-zinc-200/60 pb-5 mb-2 w-full max-w-6xl mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-955 uppercase font-sans leading-none text-center">
          Tournaments
        </h1>
      </div>

      {/* ── main container ── */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-2 pb-8 sm:pt-3 sm:pb-12 space-y-6 sm:space-y-8 flex-grow w-full">
        {tournaments.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center text-center py-10 border border-dashed border-[#8a7f77]/40 rounded-xl bg-[#D9CFC7]/30 min-h-[140px] max-w-md mx-auto">
            <div className="p-3 rounded-2xl bg-white/60 mb-3 inline-flex border border-[#D9CFC7]/30 shadow-sm">
              <Trophy size={24} className="text-orange-600" />
            </div>
            <p className="text-sm font-bold text-[#443b35]">No tournaments yet</p>
            <p className="mt-1.5 max-w-[260px] text-xs text-[#6e635c] leading-relaxed px-4">
              Tournaments will appear here once they&apos;re created. Scan a QR code at any FOG arcade machine to register scores.
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">

            {/* Active Arenas Panel Wrap Container */}
            {active.length > 0 && (
              <div className="glass-panel-3d relative flex flex-col overflow-hidden !bg-white/10 !border-[#D9CFC7]/50 p-4 sm:p-6 transition-all duration-300">
                <div className="mb-4 flex items-center justify-between border-b border-[#D9CFC7]/40 pb-3">
                  <p className="font-mono text-base font-black tracking-wide sm:tracking-[0.25em] text-[#6e635c] uppercase flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping"></span>
                    Active Arenas
                  </p>
                  <span className="font-mono text-sm text-red-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    {active.length} Live
                  </span>
                </div>

                <div className="space-y-3">
                  {active.map((t) => (
                    <TournamentCard key={t._id} t={t} env={env} mock={isMockEnabled} />
                  ))}
                </div>
              </div>
            )}

            {/* All Tournaments Panel Wrap Container */}
            {past.length > 0 && (
              <div className="glass-panel-3d relative flex flex-col overflow-hidden !bg-white/10 !border-[#D9CFC7]/50 p-4 sm:p-6 transition-all duration-300">
                <div className="mb-4 flex items-center justify-between border-b border-[#D9CFC7]/40 pb-3">
                  <p className="font-mono text-base font-black tracking-wide sm:tracking-[0.25em] text-[#6e635c] uppercase flex items-center gap-2">
                    <Clock size={14} className="text-[#8a7f77]" />
                    All Tournaments
                  </p>
                  <span className="font-mono text-sm text-muted-foreground/50 uppercase tracking-widest">
                    {past.length} Completed
                  </span>
                </div>

                <div className="space-y-3">
                  {past.map((t, idx) => (
                    <TournamentCard key={t._id} t={t} env={env} mock={isMockEnabled} index={idx} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-zinc-200 py-4 text-center bg-zinc-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center font-mono text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide sm:tracking-widest text-center">
          <span>© {new Date().getFullYear()} FOG Technologies Pvt. Limited</span>
        </div>
      </footer>
    </div>
  )
}
