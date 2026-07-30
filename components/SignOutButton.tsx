"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

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
