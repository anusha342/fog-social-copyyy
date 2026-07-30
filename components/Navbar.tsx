"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Zap, LogOut, ChevronDown } from "lucide-react"
import { signOut } from "next-auth/react"

interface Props {
  name: string | null | undefined
  image: string | null | undefined
}

export function Navbar({ name, image }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 select-none">
      {/* Clickable FOG SOCIAL Logo Link */}
      <Link href="/dashboard" className="group flex items-center gap-2 cursor-pointer select-none">
        <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
          <Zap size={13} className="fill-primary text-primary group-hover:scale-110 transition-transform" aria-hidden />
        </div>
        <span className="text-sm font-black tracking-tight uppercase">
          <span className="text-foreground transition-colors group-hover:text-primary">FOG</span>
          <span className="text-primary transition-colors group-hover:text-foreground"> SOCIAL</span>
        </span>
      </Link>

      {/* Interactive Profile Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 hover:opacity-80 active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <span className="hidden text-sm font-bold text-zinc-700 sm:block">{name}</span>
          <div className="size-8 overflow-hidden rounded-full bg-primary/20 border border-primary/10 shadow-sm">
            {image ? (
              <Image src={image} alt="" width={32} height={32} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-xs font-black text-primary">
                {name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-32 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150 origin-top-right">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-red-600 font-mono uppercase tracking-wide hover:bg-red-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <LogOut size={12} className="text-red-500" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
