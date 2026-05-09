import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import { QrCode, Gamepad2, Trophy, Star } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"

const SYNC = process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? ""
const SYNC_ENV = process.env.SYNC_ENV ?? "prod"

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
      `${SYNC}/api/v1/player/${googleId}/stats?env=${SYNC_ENV}`,
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
      `${SYNC}/api/v1/player/${googleId}/gameplays?env=${SYNC_ENV}&limit=10`,
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

  const statCards = [
    {
      label: "Games Played",
      value: stats?.games_played != null ? stats.games_played.toLocaleString() : "—",
      Icon: Gamepad2,
    },
    {
      label: "Best Score",
      value: stats?.best_score != null ? stats.best_score.toLocaleString() : "—",
      Icon: Trophy,
    },
    {
      label: "Global Rank",
      value: stats?.global_rank != null ? `#${stats.global_rank}` : "—",
      Icon: Star,
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <Navbar name={name} image={image} />
      </header>

      {/* ── Hero / welcome ── */}
      <section className="relative overflow-hidden px-6 py-16">
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

        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="size-20 overflow-hidden rounded-full border-2 border-primary/40 bg-primary/10">
              {image ? (
                <Image src={image} alt="" width={80} height={80} className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-3xl font-black text-primary">
                  {name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="absolute bottom-1 right-1 size-3 rounded-full border-2 border-background bg-primary" aria-hidden />
          </div>

          <p className="mb-2 font-mono text-[10px] tracking-[0.28em] text-foreground/35 uppercase">
            Welcome back
          </p>
          <h1 className="text-4xl font-black tracking-tight text-foreground">{firstName}</h1>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">{email}</p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="mx-auto max-w-2xl px-6 pb-8">
        <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-foreground/35 uppercase">
          Your Stats
        </p>
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="relative flex flex-col items-center overflow-hidden rounded-xl border border-border bg-card p-4 text-center"
            >
              <ShimmerEdge />
              <Icon size={14} className="mb-2 text-primary/60" aria-hidden />
              <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
              <p className="mt-1 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent games ── */}
      <section className="mx-auto max-w-2xl px-6 pb-20">
        <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-foreground/35 uppercase">
          Recent Games
        </p>

        {gameplays.length === 0 ? (
          <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <ShimmerEdge />
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <QrCode size={26} className="text-primary" aria-hidden />
            </div>
            <p className="text-sm font-bold text-foreground">No games yet</p>
            <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
              Scan a QR code at any FOG machine to start playing and track your scores.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {gameplays.map((g) => (
              <div
                key={g.gameplay_id}
                className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card px-4 py-3"
              >
                <ShimmerEdge />

                {/* Date */}
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold text-foreground">
                    {new Date(g.played_at).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {new Date(g.played_at).toLocaleTimeString(undefined, {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Score */}
                <p className="font-mono text-sm font-bold tabular-nums text-foreground">
                  {g.score.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-7 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-foreground/25 uppercase">
          FOG Technologies © {new Date().getFullYear()}
        </p>
      </footer>

    </div>
  )
}
