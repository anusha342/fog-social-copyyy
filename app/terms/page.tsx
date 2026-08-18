import Link from "next/link"
import Image from "next/image"
import { Scale, Users, ShieldAlert, Award, FileSpreadsheet, AlertTriangle, Gamepad2, Zap } from "lucide-react"
import { BackButton } from "@/components/BackButton"

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-transparent text-zinc-900 flex flex-col justify-start relative pb-16">
      {/* Subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.6] z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Hero backlight glow - Orange/Warm tint to contrast with privacy page's Cyan */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] rounded-full bg-orange-300/55 blur-[130px] z-0 animate-pulse"
        style={{ animationDuration: "10s" }}
      />

      {/* Header / Nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 select-none">
        <Link href="/" className="group flex items-center gap-2 cursor-pointer select-none">
          <div className="relative size-8 shrink-0 overflow-hidden flex items-center justify-center">
            <Image
              src="/company_logo.png"
              alt="FOG Technologies Logo"
              width={32}
              height={32}
              className="size-full object-contain group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tight uppercase">
            <span className="text-zinc-950">FOG</span>
            <span className="text-orange-500"> SOCIAL</span>
          </span>
        </Link>
        <BackButton />
      </header>

      {/* Main Content */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 pt-6">
        {/* Title Area */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="size-14 rounded-2xl bg-orange-100 border border-orange-200/50 shadow-[0_4px_12px_rgba(249,115,22,0.15)] flex items-center justify-center text-orange-600 mb-4">
            <Scale size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-mono text-zinc-400 font-bold uppercase tracking-wider">
            Last Updated: August 2026
          </p>
        </div>

        {/* Document Content Panel */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-8 md:p-12 text-zinc-800 space-y-8 leading-relaxed font-sans shadow-lg">

          {/* Quick Summary Cards */}
          <div className="border border-orange-100 bg-orange-50/10 rounded-2xl p-5 sm:p-6 mb-6 space-y-4 shadow-sm">
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-orange-850 flex items-center gap-2 uppercase font-mono">
              <span className="flex size-6 items-center justify-center rounded bg-orange-100 text-orange-600 text-xs font-bold">⚡</span>
              Quick Summary
            </h3>
            <div className="bg-white border border-orange-100/85 rounded-2xl p-4 sm:p-5 divide-y divide-orange-100/50 space-y-3.5 shadow-xs">
              {/* Card 1: Cabinet Responsibility - Cyan */}
              <div className="flex items-start gap-3.5 pt-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-white border border-cyan-600/20 shadow-sm animate-pulse" style={{ animationDuration: "6s" }}>
                  <Gamepad2 size={16} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-bold text-zinc-950 text-xs sm:text-sm">Cabinet Responsibility</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-650 leading-relaxed">Always manually log out of physical arcade terminals after scanning a QR code.</p>
                </div>
              </div>
              {/* Card 2: Competitive Integrity - Emerald */}
              <div className="flex items-start gap-3.5 pt-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white border border-emerald-600/20 shadow-sm animate-pulse" style={{ animationDuration: "8s" }}>
                  <ShieldAlert size={16} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-bold text-zinc-950 text-xs sm:text-sm">Competitive Integrity</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-650 leading-relaxed">No hacks, score manipulation, or botting allowed. Fair play is strictly enforced.</p>
                </div>
              </div>
              {/* Card 3: No Cash Value - Amber */}
              <div className="flex items-start gap-3.5 pt-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white border border-amber-600/20 shadow-sm animate-pulse" style={{ animationDuration: "7s" }}>
                  <Zap size={16} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-bold text-zinc-950 text-xs sm:text-sm">No Cash Value</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-650 leading-relaxed">Points and rewards are virtual assets and carry no real-world monetary value.</p>
                </div>
              </div>
              {/* Card 4: Partner Fulfillment - Rose */}
              <div className="flex items-start gap-3.5 pt-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white border border-rose-600/20 shadow-sm animate-pulse" style={{ animationDuration: "9s" }}>
                  <Award size={16} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-bold text-zinc-950 text-xs sm:text-sm">Partner Fulfillment</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-650 leading-relaxed">Physical prizes and distributions are handled solely by local gamezone centers.</p>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-zinc-200/50 my-6" />

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing FOG Social, registering a player profile, scanning QR codes on physical FOG cabinets, or participating in tournaments, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, do not access or use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              2. Player Account &amp; Cabinet Scan Pairing
            </h2>
            <p>
              To use the full features of FOG Social, you must link your identity using Google Sign-In. You are responsible for maintaining the security of your account credentials.
            </p>
            <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 text-sm text-zinc-700 space-y-2">
              <p className="font-semibold text-orange-850 flex items-center gap-1">
                <AlertTriangle size={15} /> Physical Terminal Security Warning:
              </p>
              <p>
                Logging into a physical arcade machine requires scanning a transient session QR code. <strong>You are solely responsible for logging out of the cabinet after finishing your play session.</strong> FOG Technologies is not liable for statistics corruption, ranking drops, or reward point consumption resulting from unauthorized players using a cabinet left active under your account.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              3. Fair Play, Cheating, and Code of Conduct
            </h2>
            <p>
              To maintain the integrity of our live global leaderboards and tournament brackets, players must adhere to strict competitive rules. You agree NOT to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 list-outside">
              <li>Inject score values directly via memory manipulation, unauthorized network intercepts, or spoofed API requests.</li>
              <li>Tamper with physical FOG cabinet hardware or local network systems.</li>
              <li>Employ automated scripts, bots, or physical timing apparatus to artificially inflate high scores.</li>
              <li>Participate in matches under another player&apos;s account during official tournament windows (smurfing/boosting).</li>
            </ul>
            <p>
              FOG Technologies reserves the right to review gameplay logs, invalidate scores, and permanently ban profiles violating these terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-950">
              4. Points &amp; Rewards
            </h2>
            <p className="text-zinc-650 text-sm">
              Rules governing point redemption:
            </p>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-sm text-zinc-700">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <p>
                  <strong>No Cash Value:</strong> Points are virtual platform assets with <strong>no real-world monetary value</strong>. They cannot be sold or transferred.
                </p>
              </div>

              <div className="flex items-start gap-2.5 text-sm text-zinc-700">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <p>
                  <strong>Balance Adjustments:</strong> We reserve the right to alter, cap, or cancel points balances for maintenance or cheat prevention.
                </p>
              </div>

              <div className="flex items-start gap-2.5 text-sm text-zinc-700">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <p>
                  <strong>Fulfillment Responsibility:</strong> All physical prizes, gifts and distribution are handled solely by the local gamezone center. FOG Technologies provides software only and is not responsible for physical prize claims, fulfillment delays or shortages at local centers.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              5. Termination of Accounts
            </h2>
            <p>
              We reserve the right to suspend, terminate, or completely delete your account at our sole discretion, without warning, if you violate these Terms, breach security protocols, or engage in behavior that disrupts the arcade competitive ecosystem.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              6. Governing Law
            </h2>
            <p>
              These terms are governed by and construed in accordance with the laws of the jurisdiction where FOG Technologies Pvt. Ltd. is registered, without giving effect to conflicts of law principles. Any dispute arising under these terms shall be subject to the exclusive jurisdiction of the competent local courts.
            </p>
          </section>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-zinc-400 font-mono">
        © {new Date().getFullYear()} FOG Technologies Pvt. Ltd. All rights reserved.
      </footer>
    </main>
  )
}
