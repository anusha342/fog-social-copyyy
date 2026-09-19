"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

interface BackButtonProps {
  fallbackHref?: string
  forceHref?: string
}

export function BackButton({ fallbackHref = "/dashboard", forceHref }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (forceHref) {
      router.push(forceHref)
      return
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    // Safe fallback to the parent page if opened directly with no history
    router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="group flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] shadow-sm select-none
        /* Mobile styles: circular, compact icon button */
        size-10 rounded-full border border-orange-200 bg-orange-50/50 hover:bg-orange-100/80 hover:border-orange-300 text-orange-700
        /* Desktop styles: md and up - rectangular pill with text */
        md:w-auto md:h-auto md:px-3 md:py-2 md:rounded-lg md:border-orange-300 md:bg-orange-50/60 md:hover:bg-orange-100/80 md:hover:border-orange-400 md:font-mono md:text-xs md:font-bold md:uppercase md:tracking-wider"
    >
      <ChevronLeft size={16} className="text-orange-500 group-hover:-translate-x-0.5 transition-transform shrink-0" />
      <span className="hidden md:inline font-mono ml-0.5">Back</span>
    </button>
  )
}
