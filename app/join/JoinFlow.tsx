"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Session } from "next-auth"
import { AlertCircle, QrCode, Loader2 } from "lucide-react"
import type { JoinErrorCode } from "@/types"
import { getUrlForEnv } from "@/lib/sync-env"

// ── Constants ─────────────────────────────────────────────────────────────────

const SYNC = process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? ""

const ERROR_COPY: Record<JoinErrorCode, { title: string; desc: string }> = {
  404: {
    title: "Session not found",
    desc: "This QR code didn't match an active game session.",
  },
  409: {
    title: "Session already played",
    desc: "This game session has already ended.",
  },
  410: {
    title: "Session expired",
    desc: "The 10-minute window has passed. Rescan the QR at the machine to start fresh.",
  },
  network: {
    title: "Connection error",
    desc: "Check your internet connection and try again.",
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  tournamentId: string
  sessionCode: string
  env: string
  session: Session | null
}

export function JoinFlow({ tournamentId, sessionCode, env, session }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<"checking" | "unauthenticated" | "joining" | "error">("checking")
  const [errorCode, setErrorCode] = useState<JoinErrorCode | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  // Incrementing this re-triggers the join effect (used for retry).
  const [retryKey, setRetryKey] = useState(0)

  // ── Session pre-check ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const res = await fetch(
          getUrlForEnv(`${SYNC}/api/v1/tournament/${tournamentId}/session/${sessionCode}`, env)
        )
        if (cancelled) return

        if (res.status === 404) {
          setErrorCode(404)
          setPhase("error")
        } else if (res.status === 410) {
          setErrorCode(410)
          setPhase("error")
        } else {
          setPhase(session ? "joining" : "unauthenticated")
        }
      } catch {
        if (!cancelled) {
          // Network error during pre-check — let the join attempt surface it.
          setPhase(session ? "joining" : "unauthenticated")
        }
      }
    }

    checkSession()
    return () => { cancelled = true }
  }, [tournamentId, sessionCode, env, session])

  // ── Join ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "joining") return
    if (!session) return

    let cancelled = false
    setErrorCode(null)

    async function join() {
      try {
        const res = await fetch(
          `${SYNC}/api/v1/tournament/${tournamentId}/join`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_code: sessionCode,
              ...(env !== "prod" ? { env } : {}),
              player: {
                google_id: session!.user.google_id,
              },
            }),
          }
        )

        if (cancelled) return

        if (!res.ok) {
          const code: JoinErrorCode =
            res.status === 404 || res.status === 409 || res.status === 410
              ? res.status
              : "network"
          setErrorCode(code)
          setPhase("error")
          return
        }

        const body = await res.json()
        if (!cancelled) {
          router.replace(
            getUrlForEnv(`/tournament/${tournamentId}?pid=${encodeURIComponent(body.player._id)}`, env)
          )
        }
      } catch {
        if (!cancelled) {
          setErrorCode("network")
          setPhase("error")
        }
      }
    }

    join()
    return () => { cancelled = true }
  }, [phase, session, tournamentId, sessionCode, env, retryKey, router])

  // ── Checking ─────────────────────────────────────────────────────────────
  if (isSigningIn) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3.5">
          <Loader2 size={28} className="text-primary animate-spin" aria-hidden />
          <p className="text-base sm:text-lg font-bold text-zinc-955 uppercase font-sans tracking-wide">Connecting to Google…</p>
        </div>
      </div>
    )
  }

  if (phase === "checking") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3.5">
          <Loader2 size={28} className="text-primary animate-spin" aria-hidden />
          <p className="text-base sm:text-lg font-bold text-zinc-955 uppercase font-sans tracking-wide">Checking session…</p>
          <p className="font-mono text-sm tracking-widest text-muted-foreground uppercase">
            {sessionCode.toUpperCase()}
          </p>
        </div>
      </div>
    )
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (phase === "unauthenticated") {
    const callbackUrl = getUrlForEnv(`/join?t=${encodeURIComponent(tournamentId)}&s=${encodeURIComponent(sessionCode)}`, env)
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 bg-background">
        <div className="flex w-full max-w-[320px] flex-col items-center text-center">
          {/* Session code display */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <QrCode size={30} className="text-primary/50" aria-hidden />
            <span className="font-mono text-xs tracking-widest text-foreground/35 uppercase">
              Session Code
            </span>
            <span className="font-mono text-2xl font-bold tracking-[0.15em] text-primary">
              {sessionCode.toUpperCase()}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-955 uppercase font-sans leading-none text-center">Join the tournament</h1>
          <p className="mt-2 mb-8 text-base leading-relaxed text-muted-foreground">
            Sign in with Google to link your account to this game session.
          </p>

          <button
            onClick={() => {
              setIsSigningIn(true)
              signIn("google", { callbackUrl })
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  // ── Joining ───────────────────────────────────────────────────────────────
  if (phase === "joining") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3.5">
          <Loader2 size={28} className="text-primary animate-spin" aria-hidden />
          <p className="text-base sm:text-lg font-bold text-zinc-955 uppercase font-sans tracking-wide">Joining tournament…</p>
          <p className="font-mono text-sm tracking-widest text-muted-foreground uppercase">
            {sessionCode.toUpperCase()}
          </p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === "error" && errorCode !== null) {
    const { title, desc } = ERROR_COPY[errorCode]
    return (
      <div className="flex min-h-svh items-center justify-center px-6 bg-background">
        <div className="flex w-full max-w-[320px] flex-col items-center gap-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle size={26} className="text-destructive" aria-hidden />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-955 uppercase font-sans leading-none text-center">{title}</h1>
            <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{desc}</p>
          </div>
          {errorCode === "network" && (
            <button
              onClick={() => { setPhase("joining"); setRetryKey((k) => k + 1) }}
              className="rounded-xl bg-primary px-6 py-2.5 text-base font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
