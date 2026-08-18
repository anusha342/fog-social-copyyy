import Link from "next/link"
import Image from "next/image"
import { Shield, Eye, Lock, FileText, Globe, Trophy, UserCheck, QrCode, Trash2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"

export default function PrivacyPolicy() {
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

      {/* Hero backlight glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] rounded-full bg-cyan-300/55 blur-[130px] z-0 animate-pulse"
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
          <div className="size-14 rounded-2xl bg-cyan-100 border border-cyan-200/50 shadow-[0_4px_12px_rgba(6,182,212,0.15)] flex items-center justify-center text-cyan-600 mb-4">
            <Shield size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-mono text-zinc-400 font-bold uppercase tracking-wider">
            Last Updated: August 2026
          </p>
        </div>

        {/* Document Content Panel */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-8 md:p-12 text-zinc-800 space-y-8 leading-relaxed font-sans shadow-lg">

          {/* Quick Summary Cards */}
          <div className="border border-cyan-100 bg-cyan-50/10 rounded-2xl p-5 sm:p-6 mb-6 space-y-4 shadow-sm">
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-cyan-850 flex items-center gap-2 uppercase font-mono">
              <span className="flex size-6 items-center justify-center rounded bg-cyan-100 text-cyan-600 text-xs font-bold">⚡</span>
              Quick Summary
            </h3>
            <div className="bg-white border border-cyan-100/85 rounded-2xl p-4 sm:p-5 divide-y divide-cyan-100/50 space-y-3.5 shadow-xs">
              {/* Card 1: Public Leaderboards - Cyan */}
              <div className="flex items-start gap-3.5 pt-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-white border border-cyan-600/20 shadow-sm animate-pulse" style={{ animationDuration: "6s" }}>
                  <Trophy size={16} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-bold text-zinc-950 text-xs sm:text-sm">Public Leaderboards</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-650 leading-relaxed">Scores and stats are public on physical cabinet screens and web dashboards.</p>
                </div>
              </div>
              {/* Card 2: Google Sign-in - Emerald */}
              <div className="flex items-start gap-3.5 pt-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white border border-emerald-600/20 shadow-sm animate-pulse" style={{ animationDuration: "8s" }}>
                  <UserCheck size={16} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-bold text-zinc-950 text-xs sm:text-sm">Google Sign-in</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-650 leading-relaxed">We collect only your basic profile info (email, name, photo) via Google SSO.</p>
                </div>
              </div>
              {/* Card 3: QR Code Pairings - Amber */}
              <div className="flex items-start gap-3.5 pt-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white border border-amber-600/20 shadow-sm animate-pulse" style={{ animationDuration: "7s" }}>
                  <QrCode size={16} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-bold text-zinc-950 text-xs sm:text-sm">QR Code Pairings</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-650 leading-relaxed">Remember to log out of the physical cabinet terminal when done playing.</p>
                </div>
              </div>
              {/* Card 4: Right to Purge - Rose */}
              <div className="flex items-start gap-3.5 pt-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white border border-rose-600/20 shadow-sm animate-pulse" style={{ animationDuration: "9s" }}>
                  <Trash2 size={16} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-bold text-zinc-950 text-xs sm:text-sm">Right to Purge</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-650 leading-relaxed">Complete profile deletion requests are processed in 30 days via support email.</p>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-zinc-200/50 my-6" />

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              1. Introduction
            </h2>
            <p>
              Welcome to <strong>FOG Social</strong>, operated by FOG Technologies Pvt. Ltd. (&quot;FOG Technologies&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We connect physical arcade terminals with digital competitor identities. We respect your privacy and are committed to protecting your personal data.
            </p>
            <p>
              This Privacy Policy explains how we collect, process, display, and protect your information when you register an account, scan QR codes at physical FOG arcade cabinets, join tournaments, or interact with our web platform (collectively, the &quot;Services&quot;).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              2. Data We Collect
            </h2>
            <p>
              To provide our gaming profile, synchronization, and tournament services, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 list-outside">
              <li>
                <strong>Authentication Information:</strong> When you register using Google Sign-In, we receive your email, full name, Google ID, and avatar URL.
              </li>
              <li>
                <strong>Gameplay &amp; Tournament Statistics:</strong> Scores, gametime, input data, matches played, tournament participation, and game histories generated while playing at physical FOG cabinets or on synced machines.
              </li>
              <li>
                <strong>IoT &amp; Cabinet Interaction Logs:</strong> Logs indicating when and where you scanned a cabinet QR code, cabinet ID pairings, and session duration.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              3. Public Leaderboards &amp; Profile Consent
            </h2>
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 text-sm text-zinc-700 space-y-2">
              <p className="font-semibold text-amber-800">
                IMPORTANT COMPETITIVE PLATFORM INFORMATION:
              </p>
              <p>
                FOG Social is built around live competitive gaming. By signing up and playing on FOG-synced arcade machines, you explicitly agree that:
              </p>
              <ul className="list-disc pl-5 space-y-1 list-outside">
                <li>Your gaming alias, scores, ranks, and profile avatar will be publicly displayed on live web leaderboards.</li>
                <li>Your player history and stats can be shown to other users searching the dashboard.</li>
                <li>Your ranking and stats will be displayed publicly on physical arcade cabinet monitors when active or on nearby leaderboard terminals.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              4. How We Use Your Data
            </h2>
            <p>We process your data for the following legitimate business interests:</p>
            <ul className="list-disc pl-6 space-y-1.5 list-outside">
              <li>To maintain your global arcade profile identity.</li>
              <li>To synchronize arcade scores from physical terminals to our database.</li>
              <li>To track rankings, distribute tournament achievements, and award reward points.</li>
              <li>To detect and prevent cheating, automated hacks, or session hijackings.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              5. Security
            </h2>
            <p>
              We implement industry-standard security measures, including data encryption and access controls, to protect your personal information. While we take reasonable precautions, we cannot guarantee that breaches or unauthorized access will never occur, particularly if they arise from operators or third-party providers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              6. QR Cabinet Pairings &amp; Session Termination
            </h2>
            <p>
              To play using your account, you must scan a QR code displayed on a physical cabinet. This sets up a local session token on the cabinet.
            </p>
            <p className="font-semibold text-zinc-950">
              Users must always remember to log out of the physical cabinet after ending their gameplay session. Leaving a cabinet logged in exposes your profile stats, achievements, and rewards to other arcade visitors. We store cabinet session tokens with a strict short-term TTL to automatically expire sessions, but physical care is the player&apos;s responsibility.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              7. Cookies
            </h2>
            <p>
              We use cookies to maintain the session of your user. It is not used to personally identify you on other websites.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              8. Children’s Privacy
            </h2>
            <p>
              FOG complies with international laws such as the Children’s Online Privacy Protection Act (COPPA) in the USA. We do not knowingly collect data from children under 13 without verified parental consent. If we discover that we have collected personal data from a child under 13 without consent, we will take steps to delete that information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              9. Data Retention &amp; Deletion (Your Rights)
            </h2>
            <p>
              We retain your account details as long as your profile is active. You have the right to request deletion of your account and statistics at any time under GDPR, CCPA, and Google API User Data Policies.
            </p>
            <p>
              To request a complete removal of your profile data, email our support team at <code className="bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-xs sm:text-sm border border-zinc-200 break-all">support@futureofgaming.tech</code>. We will purge your profile details (including linked authentication credentials) within 30 days. Scores posted to permanent tournament records will be anonymized.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-950">
              10. Contact Us
            </h2>
            <p>
              For privacy concerns, data export requests, or questions regarding physical cabinet integrations, reach us at:
            </p>
            <div className="border border-zinc-200 bg-zinc-50/50 rounded-xl p-4 sm:p-5 text-xs sm:text-sm space-y-1.5 font-mono text-zinc-600 break-words overflow-hidden">
              <p className="font-bold text-zinc-800 break-words">FOG Technologies Pvt. Ltd.</p>
              <p className="break-words text-[11px] sm:text-xs">Legal &amp; Privacy Compliance Department</p>
              <p className="break-words">Email: support@futureofgaming.tech</p>
              <p className="break-words">Web: www.futureofgaming.tech</p>
            </div>
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
