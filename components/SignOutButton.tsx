"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground active:scale-[0.97]"
    >
      <LogOut size={11} />
      Sign out
    </button>
  )
}
