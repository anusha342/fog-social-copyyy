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

function TournamentCard({ t, env, index }: { t: Tournament; env: string; index?: number }) {
  const href =
    env === "prod" ? `/tournament/${t._id}` : `/tournament/${t._id}?env=${env}`

  const isActive = t.status === "active"

  const activePalette = {
    card: "border-orange-400/80 bg-orange-100/45 backdrop-blur-md shadow-[0_4px_14px_rgba(249,115,22,0.12)] hover:border-orange-500 hover:bg-orange-100/60 hover:shadow-[0_8px_24px_rgba(249,115,22,0.22)] pl-4.5 min-[390px]:pl-5 sm:pl-6",
    icon: "bg-orange-100 text-orange-600 shadow-[0_2px_8px_rgba(249,115,22,0.15)]",
    badge: "text-orange-700 bg-orange-100/50 border-orange-200/40 font-bold",
    badgeIcon: "text-orange-500",
  }

  const COLOR_PALETTES = [
    // Cyan / Blue
    {
      card: "border-cyan-400/80 bg-cyan-100/45 backdrop-blur-md shadow-[0_4px_14px_rgba(6,182,212,0.1)] hover:border-cyan-500 hover:bg-cyan-100/60 hover:shadow-[0_8px_24px_rgba(6,182,212,0.2)]",
      icon: "bg-cyan-100 text-cyan-600 shadow-[0_2px_8px_rgba(6,182,212,0.15)]",
      badge: "text-cyan-700 bg-cyan-100/50 border-cyan-200/40 font-bold",
      badgeIcon: "text-cyan-500",
    },
    // Violet / Indigo
    {
      card: "border-indigo-400/80 bg-indigo-100/45 backdrop-blur-md shadow-[0_4px_14px_rgba(99,102,241,0.1)] hover:border-indigo-500 hover:bg-indigo-100/60 hover:shadow-[0_8px_24px_rgba(99,102,241,0.2)]",
      icon: "bg-indigo-100 text-indigo-600 shadow-[0_2px_8px_rgba(99,102,241,0.15)]",
      badge: "text-indigo-700 bg-indigo-100/50 border-indigo-200/40 font-bold",
      badgeIcon: "text-indigo-500",
    },
    // Pink / Rose
    {
      card: "border-pink-400/80 bg-pink-100/45 backdrop-blur-md shadow-[0_4px_14px_rgba(244,63,94,0.1)] hover:border-pink-500 hover:bg-pink-100/60 hover:shadow-[0_8px_24px_rgba(244,63,94,0.2)]",
      icon: "bg-pink-100 text-pink-600 shadow-[0_2px_8px_rgba(244,63,94,0.15)]",
      badge: "text-pink-700 bg-pink-100/50 border-pink-200/40 font-bold",
      badgeIcon: "text-pink-500",
    },
    // Emerald / Green
    {
      card: "border-emerald-400/80 bg-emerald-100/45 backdrop-blur-md shadow-[0_4px_14px_rgba(16,185,129,0.1)] hover:border-emerald-500 hover:bg-emerald-100/60 hover:shadow-[0_8px_24px_rgba(16,185,129,0.2)]",
      icon: "bg-emerald-100 text-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.15)]",
      badge: "text-emerald-700 bg-emerald-100/50 border-emerald-200/40 font-bold",
      badgeIcon: "text-emerald-500",
    },
  ]

  const palette = isActive
    ? activePalette
    : COLOR_PALETTES[(index ?? 0) % COLOR_PALETTES.length]

  const label =
    t.name ??
    new Date(t.started_at).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

  const startDateStr = new Date(t.started_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const endDateStr = t.ended_at
    ? new Date(t.ended_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  const dateRangeStr = endDateStr
    ? `${startDateStr} — ${endDateStr}`
    : `${startDateStr} — Active`

  return (
    <Link
      href={href}
      className={`group relative flex items-center justify-between rounded-xl border p-3 min-[390px]:p-3.5 sm:p-4 overflow-hidden transition-all duration-300 hover:shadow-sm hover:-translate-y-1 ${palette.card}`}
    >
      {/* Brand accent stripe for live item */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-orange-500 rounded-l-xl" />
      )}

      <div className="flex items-center gap-2 min-[390px]:gap-3 sm:gap-4 min-w-0">
        {/* Icon */}
        <div
          className={`flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 ${palette.icon}`}
        >
          <Trophy size={16} className="sm:size-[18px]" />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs sm:text-sm md:text-base font-bold text-zinc-900 truncate">
              {label}
            </span>
            {isActive && (
              <span className="flex shrink-0 items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                <span className="size-1 animate-pulse rounded-full bg-orange-500" />
                Live
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 mt-1">
            <span className={`flex items-center gap-0.5 sm:gap-1 font-mono text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded border ${palette.badge}`}>
              <Users size={9} className={palette.badgeIcon} />
              {t.player_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1 font-mono text-[9px] sm:text-[10px] text-[#6e635c]">
              <Calendar size={9} className="text-[#8a7f77]" />
              {dateRangeStr}
            </span>
          </div>
        </div>
      </div>

      {/* Top score + arrow */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 ml-2">
        {t.top_score != null && (
          <div className="text-right">
            <p className="font-mono text-[8px] sm:text-[9px] text-[#6e635c]/80 uppercase tracking-widest leading-none mb-0.5 hidden min-[390px]:block">Top Score</p>
            <p className="font-mono text-xs sm:text-sm md:text-base font-bold tabular-nums text-zinc-900 leading-none">
              {t.top_score.toLocaleString()}
            </p>
          </div>
        )}
        <ChevronRight size={14} className="text-[#8a7f77] group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  )
}

export default async function TournamentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  const tournaments = await fetchTournaments()
  const active = tournaments.filter((t) => t.status === "active")
  const past = tournaments.filter((t) => t.status === "past")

  const summary =
    tournaments.length > 0
      ? `${tournaments.length} tournament${tournaments.length !== 1 ? "s" : ""}${active.length > 0 ? ` · ${active.length} live` : ""}`
      : "Browse active and past competitions"

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 text-zinc-900 relative overflow-hidden select-none">
      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <Navbar name={session.user.name} image={session.user.image} />
      </header>

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

      {/* ── Back Navigation Wrapper (Sticky below Navbar) ── */}
      <div className="sticky top-[56px] z-30 bg-zinc-100/95 backdrop-blur-md py-3 mb-2">
        <div className="mx-auto w-full max-w-7xl px-4 flex justify-start">
          <BackButton />
        </div>
      </div>

      {/* ── Hero Title Section ── */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pt-2 pb-4 sm:px-6 sm:pt-4 sm:pb-6">
        <h1 className="text-xl min-[390px]:text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 uppercase font-sans leading-none text-center">
          Tournaments
        </h1>
      </section>

      {/* ── main container ── */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-20 sm:px-6 space-y-6 sm:space-y-8 flex-grow w-full">
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
              <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#D9CFC7] bg-white p-4 sm:p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-[#D9CFC7]/40 pb-3">
                  <p className="font-mono text-xs sm:text-sm font-bold tracking-wide sm:tracking-[0.25em] text-[#6e635c] uppercase flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping"></span>
                    Active Arenas
                  </p>
                  <span className="font-mono text-xs text-red-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    {active.length} Live
                  </span>
                </div>

                <div className="space-y-3">
                  {active.map((t) => (
                    <TournamentCard key={t._id} t={t} env={SYNC_ENV} />
                  ))}
                </div>
              </div>
            )}

            {/* All Tournaments Panel Wrap Container */}
            {past.length > 0 && (
              <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#D9CFC7] bg-white p-4 sm:p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-[#D9CFC7]/40 pb-3">
                  <p className="font-mono text-xs sm:text-sm font-bold tracking-wide sm:tracking-[0.25em] text-[#6e635c] uppercase flex items-center gap-2">
                    <Clock size={14} className="text-[#8a7f77]" />
                    All Tournaments
                  </p>
                  <span className="font-mono text-xs text-muted-foreground/50 uppercase tracking-widest">
                    {past.length} Completed
                  </span>
                </div>

                <div className="space-y-3">
                  {past.map((t, idx) => (
                    <TournamentCard key={t._id} t={t} env={SYNC_ENV} index={idx} />
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
