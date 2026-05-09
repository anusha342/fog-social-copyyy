import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Trophy, Gamepad2, UserCircle, Zap, QrCode } from "lucide-react"
import { authOptions } from "@/lib/auth"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

const features = [
  {
    Icon: UserCircle,
    title: "Your Arcade Profile",
    description: "One identity across every FOG machine. Your stats, your rank, your legacy.",
  },
  {
    Icon: Trophy,
    title: "Live Leaderboards",
    description: "Real-time rankings during tournaments. See where you stand the moment your score lands.",
  },
  {
    Icon: Gamepad2,
    title: "Game History",
    description: "Every session logged. Track your progress and watch yourself improve over time.",
  },
]

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">

      {/* ── Hero ── */}
      <section className="relative flex min-h-svh flex-col items-center justify-center px-6 py-20">
        {/* Grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Top radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -5%, color-mix(in oklch, var(--primary) 20%, transparent) 0%, transparent 65%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
          {/* Brand pill */}
          <div className="mb-9 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] text-primary/75 uppercase">
            <Zap size={9} className="fill-primary/75" aria-hidden />
            FOG Technologies
          </div>

          {/* Wordmark — scales with viewport */}
          <h1 className="font-black leading-none tracking-tighter">
            <span
              className="block text-foreground"
              style={{ fontSize: "clamp(72px, 11vw, 140px)", lineHeight: 0.88 }}
            >
              FOG
            </span>
            <span
              className="block text-primary"
              style={{ fontSize: "clamp(72px, 11vw, 140px)", lineHeight: 0.88 }}
            >
              SOCIAL
            </span>
          </h1>

          {/* Tagline */}
          <p className="mt-8 font-mono text-[11px] tracking-[0.28em] text-foreground/35 uppercase">
            Play · Track · Compete
          </p>

          {/* Description */}
          <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground md:max-w-md md:text-[15px]">
            Your arcade identity. Every game on a FOG machine tracked, ranked, and remembered.
          </p>

          {/* Google CTA */}
          <Link
            href="/api/auth/signin"
            className="mt-10 flex w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-all duration-100 hover:opacity-90 active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google
          </Link>

          {/* QR hint */}
          <div className="mt-5 flex items-center gap-1.5 font-mono text-[11px] text-foreground/30">
            <QrCode size={11} aria-hidden />
            <span>or scan a QR at any FOG machine</span>
          </div>
        </div>

        {/* Arcade ambient decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-7 flex select-none justify-between font-mono text-[10px] uppercase tracking-widest text-primary/20"
        >
          <div>
            <div>Hi-Score</div>
            <div className="mt-0.5 text-lg font-bold">999999</div>
          </div>
          <div className="text-right">
            <div>Credit</div>
            <div className="mt-0.5 text-lg font-bold">00</div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto w-full max-w-4xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
            >
              {/* shimmer top edge */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, color-mix(in oklch, var(--primary) 35%, transparent), transparent)",
                }}
              />
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon size={19} className="text-primary" aria-hidden />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">{title}</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-7 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-foreground/25 uppercase">
          FOG Technologies © {new Date().getFullYear()}
        </p>
      </footer>

    </main>
  )
}
