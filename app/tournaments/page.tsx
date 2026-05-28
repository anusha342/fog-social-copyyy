import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Trophy, Users, Calendar, ChevronRight } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { SYNC_ENV, getUrlForEnv } from "@/lib/sync-env"
import type { Tournament, TournamentsResponse } from "@/types"

const SYNC = process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? ""

// ── Fetchers ──────────────────────────────────────────────────────────────────

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

// ── Components ────────────────────────────────────────────────────────────────

function ShimmerEdge() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent, color-mix(in oklch, var(--primary) 35%, transparent), transparent)",
      }}
    />
  )
}

function TournamentCard({ t, env }: { t: Tournament; env: string }) {
  const href =
    env === "prod" ? `/tournament/${t._id}` : `/tournament/${t._id}?env=${env}`

  const isActive = t.status === "active"

  const label =
    t.name ??
    new Date(t.started_at).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

  const dateStr = new Date(t.started_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Link
      href={href}
      className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]"
    >
      <ShimmerEdge />

      {/* Icon */}
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          isActive ? "bg-primary/15" : "bg-muted"
        }`}
      >
        <Trophy
          size={18}
          className={isActive ? "text-primary" : "text-muted-foreground"}
          aria-hidden
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <p className="truncate text-sm font-bold text-foreground">{label}</p>
          {isActive && (
            <span className="flex shrink-0 items-center gap-1">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              <span className="font-mono text-[9px] tracking-wider text-primary uppercase">
                Live
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <Users size={9} aria-hidden />
            {t.player_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <Calendar size={9} aria-hidden />
            {dateStr}
          </span>
        </div>
      </div>

      {/* Top score + arrow */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        {t.top_score != null && (
          <p className="font-mono text-sm font-bold tabular-nums text-foreground">
            {t.top_score.toLocaleString()}
          </p>
        )}
        <ChevronRight size={14} className="text-muted-foreground" aria-hidden />
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <Navbar name={session.user.name} image={session.user.image} />
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 50% -5%, color-mix(in oklch, var(--primary) 18%, transparent) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Tournaments
          </h1>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">
            {summary}
          </p>
        </div>
      </section>

      {/* ── List ── */}
      <div className="mx-auto max-w-4xl space-y-8 px-6 pb-20">

        {tournaments.length === 0 ? (
          <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <ShimmerEdge />
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Trophy size={26} className="text-primary" aria-hidden />
            </div>
            <p className="text-sm font-bold text-foreground">No tournaments yet</p>
            <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
              Tournaments will appear here once they&apos;re created. Scan a QR
              code at any FOG machine to join one.
            </p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-foreground/35 uppercase">
                  Active
                </p>
                <div className="space-y-2">
                  {active.map((t) => (
                    <TournamentCard key={t._id} t={t} env={SYNC_ENV} />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-foreground/35 uppercase">
                  Past
                </p>
                <div className="space-y-2">
                  {past.map((t) => (
                    <TournamentCard key={t._id} t={t} env={SYNC_ENV} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-7 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-foreground/25 uppercase">
          FOG Technologies © {new Date().getFullYear()}
        </p>
      </footer>

    </div>
  )
}
