"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { signIn, signOut } from "next-auth/react"
import { LogOut, Loader2 } from "lucide-react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-1.5 rounded-lg border border-red-200/50 bg-red-50/30 px-2.5 py-1.5 text-xs font-bold text-red-600 font-mono tracking-wider uppercase transition-all hover:bg-red-50 hover:border-red-300 active:scale-[0.97] cursor-pointer shadow-sm"
    >
      <LogOut size={11} className="text-red-500" />
      Exit
    </button>
  )
}

export function GoogleSignInButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {loading && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/30 backdrop-blur-sm">
          <Loader2 className="animate-spin text-orange-500 size-12" strokeWidth={2.5} />
        </div>,
        document.body
      )}
      <button
        onClick={() => {
          setLoading(true)
          signIn("google")
        }}
        className={className}
      >
        {children}
      </button>
    </>
  )
}
