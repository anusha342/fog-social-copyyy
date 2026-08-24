"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { getPageName, logRocketManager } from "@/lib/logRocketManager"

const CLICKABLE_SELECTOR = 'button, a[href], [role="button"], [data-slot="button"]'

function getClickLabel(el: Element): string {
  const explicit = el.getAttribute("data-track-label") || el.getAttribute("aria-label")
  if (explicit) return explicit
  const text = el.textContent?.trim().replace(/\s+/g, " ")
  if (text) return text.slice(0, 60)
  return el.tagName.toLowerCase()
}

/**
 * Mounted once in the root layout. Covers every page (signed in or not):
 * starts recording, tracks page views on route change, and tracks every
 * button/link click site-wide via event delegation.
 */
export function LogRocketInit() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    logRocketManager.init()
  }, [])

  useEffect(() => {
    const query = searchParams.toString()
    logRocketManager.trackPageView(query ? `${pathname}?${query}` : pathname, pathname)
  }, [pathname, searchParams])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const control = (e.target as HTMLElement).closest(CLICKABLE_SELECTOR)
      if (!control) return
      const currentPathname = window.location.pathname
      logRocketManager.trackClick(getClickLabel(control), {
        tag: control.tagName.toLowerCase(),
        path: currentPathname,
        page: getPageName(currentPathname),
      })
    }

    document.addEventListener("click", handleClick, { capture: true })
    return () => document.removeEventListener("click", handleClick, { capture: true })
  }, [])

  return null
}
