"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export function NavigationLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  // Hide the loader as soon as the path or search parameters update
  useEffect(() => {
    setIsLoading(false)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      const target = anchor.getAttribute("target")

      // Skip external, anchor scroll, mailto, tel, target="_blank", or empty hrefs
      if (
        !href ||
        target === "_blank" ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return
      }

      // Ignore modifier clicks (e.g. Ctrl + Click to open in new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
        return
      }

      // Check if it is a same-page navigation
      try {
        const currentUrl = new URL(window.location.href)
        const targetUrl = new URL(href, window.location.href)

        if (
          currentUrl.origin === targetUrl.origin &&
          currentUrl.pathname === targetUrl.pathname &&
          currentUrl.search === targetUrl.search
        ) {
          return
        }
      } catch {
        // Fallback for relative paths
      }

      // Trigger the transparent glassy overlay immediately
      setIsLoading(true)
    }

    document.addEventListener("click", handleAnchorClick, { capture: true })

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true })
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1.5px] transition-all duration-300">
      <div className="flex flex-col items-center gap-4.5 animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="animate-spin text-orange-500 size-11 sm:size-14" strokeWidth={2.5} />
        <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-zinc-600/90 select-none">
          LOADING...
        </span>
      </div>
    </div>
  )
}
