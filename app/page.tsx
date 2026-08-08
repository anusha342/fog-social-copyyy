import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Trophy, Gamepad2, UserCircle, Zap, QrCode } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { InteractiveLogo } from "../components/Navbar"
import { GoogleSignInButton } from "../components/SignOutButton"


function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden>
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
    iconClass: "bg-cyan-100 text-cyan-600 border border-cyan-200/50 shadow-[0_2px_8px_rgba(6,182,212,0.15)]",
    cardClass: "glass-pill-3d !bg-cyan-100/55 hover:!bg-cyan-100/75 border-cyan-400/80 shadow-[0_6px_20px_rgba(6,182,212,0.15)] hover:shadow-[0_10px_30px_rgba(6,182,212,0.25)] hover:border-cyan-500/90 active:scale-[0.99] transition-all"
  },
  {
    Icon: Trophy,
    title: "Live Leaderboards",
    description: "Real-time rankings during tournaments. See where you stand the moment your score lands.",
    iconClass: "bg-amber-100 text-amber-600 border border-amber-200/50 shadow-[0_2px_8px_rgba(245,158,11,0.15)]",
    cardClass: "glass-pill-3d !bg-amber-100/55 hover:!bg-amber-100/75 border-amber-400/80 shadow-[0_6px_20px_rgba(245,158,11,0.15)] hover:shadow-[0_10px_30px_rgba(245,158,11,0.25)] hover:border-amber-500/90 active:scale-[0.99] transition-all"
  },
  {
    Icon: Gamepad2,
    title: "Game History",
    description: "Every session logged. Track your progress and watch yourself improve over time.",
    iconClass: "bg-emerald-100 text-emerald-600 border border-emerald-200/50 shadow-[0_2px_8px_rgba(16,185,129,0.15)]",
    cardClass: "glass-pill-3d !bg-emerald-100/55 hover:!bg-emerald-100/75 border-emerald-400/80 shadow-[0_6px_20px_rgba(16,185,129,0.15)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.25)] hover:border-emerald-500/90 active:scale-[0.99] transition-all"
  },
]

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <main className="min-h-screen overflow-x-hidden bg-transparent text-zinc-900 flex flex-col justify-start relative">
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



      {/* ── Hero ── */}
      <section className="relative flex flex-grow flex-col items-center justify-start px-6 pt-10 sm:pt-16 pb-12 z-10">

        {/* Content */}
        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">

          {/* Company Logo Image */}
          <div 
            className="mb-8 size-20 flex items-center justify-center logo-float"
            style={{ animationDelay: '0.6s' }}
          >
            <Image 
              src="/company_logo.png" 
              alt="FOG Technologies" 
              width={80} 
              height={80} 
              className="size-full object-contain"
              style={{
                filter: "drop-shadow(1px 1px 0px #ffffff) drop-shadow(1px 1px 0px #fed7aa) drop-shadow(1px 1px 0px #f97316) drop-shadow(1px 1px 0px #ea580c) drop-shadow(1px 1px 0px #9a3412) drop-shadow(2px 2px 8px rgba(0,0,0,0.25))"
              }}
            />
          </div>

          {/* Wordmark — scales with viewport (Interactive 3D Loop-Reveal Component) */}
          <InteractiveLogo />

          {/* Tagline */}
          <p className="mt-8 font-mono text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">
            Play · Track · Compete
          </p>

          {/* Description */}
          <p className="mt-5 max-w-sm text-base leading-relaxed text-zinc-600 md:max-w-md">
            Your arcade identity. Every game on a FOG machine tracked, ranked, and remembered.
          </p>

          {/* Google CTA */}
          <GoogleSignInButton
            className="mt-10 flex w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer font-sans text-base tracking-wide border border-transparent"
          >
            <div className="flex size-5 shrink-0 items-center justify-center rounded bg-white shadow-sm mr-1">
              <GoogleIcon />
            </div>
            Continue with Google
          </GoogleSignInButton>

          {/* QR hint */}
          <div className="mt-5 flex items-center gap-1.5 font-mono text-xs text-zinc-400 font-medium">
            <QrCode size={11} className="text-zinc-400" aria-hidden />
            <span>or scan a QR at any FOG machine</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-4 pb-20 relative z-10">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {features.map(({ Icon, title, description, iconClass, cardClass }) => (
            <div
              key={title}
              className={`relative overflow-hidden rounded-2xl p-6 hover:-translate-y-0.5 transition-all duration-300 ${cardClass}`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                  <Icon size={22} className="text-inherit" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-955">{title}</h2>
                  <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-zinc-700">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-zinc-200 py-4 text-center bg-zinc-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center font-mono text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide sm:tracking-widest text-center">
          <span>© {new Date().getFullYear()} FOG Technologies Pvt. Limited</span>
        </div>
      </footer>

    </main>
  )
}
