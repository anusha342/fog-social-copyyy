import LogRocket from "logrocket"

// Public LogRocket project id — this is a client-embedded identifier, not a secret.
// Override per-environment via NEXT_PUBLIC_LOGROCKET_APP_ID if needed.
const DEFAULT_APP_ID = "qkapm0/fog-social"

interface LogRocketUser {
  id: string
  name?: string | null
  email?: string | null
}

let initialized = false
let identifiedUserId: string | null = null
const clickCounts: Record<string, number> = {}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function isEnabled(): boolean {
  // Explicit kill switch (e.g. local dev) without touching code: set to "false" to disable.
  return process.env.NEXT_PUBLIC_LOGROCKET_ENABLED !== "false"
}

function getAppId(): string {
  return process.env.NEXT_PUBLIC_LOGROCKET_APP_ID || DEFAULT_APP_ID
}

const STATIC_PAGE_NAMES: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/tournaments": "Tournaments",
  "/join": "Join",
}

/**
 * Collapses a raw pathname (query string stripped, dynamic segments folded)
 * into a stable page label so LogRocket charts group by page instead of
 * fragmenting across every tournament ID / query variant.
 */
export function getPageName(pathname: string): string {
  if (STATIC_PAGE_NAMES[pathname]) return STATIC_PAGE_NAMES[pathname]
  if (/^\/tournament\/[^/]+$/.test(pathname)) return "Tournament Detail"
  return pathname
}

/**
 * Single point of control for all LogRocket calls in the app.
 * Every function is a no-op on the server, before init, or when disabled —
 * callers never need to guard for those cases themselves.
 */
export const logRocketManager = {
  /** Starts session recording. Safe to call from every page (including anonymous ones); idempotent. */
  init(): void {
    if (!isBrowser() || !isEnabled() || initialized) return
    try {
      LogRocket.init(getAppId())
      initialized = true
    } catch (err) {
      console.error("[LogRocket] init failed", err)
    }
  },

  /** Attaches a stable user identity to the current recording session once it's known. */
  identify(user: LogRocketUser): void {
    if (!isBrowser() || !initialized || !user?.id) return
    if (identifiedUserId === user.id) return // avoid redundant identify calls on re-render/navigation
    try {
      LogRocket.identify(user.id, {
        ...(user.name ? { name: user.name } : {}),
        ...(user.email ? { email: user.email } : {}),
      })
      identifiedUserId = user.id
    } catch (err) {
      console.error("[LogRocket] identify failed", err)
    }
  },

  /** Records a custom event on the current session (e.g. "tournament_joined"). */
  track(eventName: string, properties?: Record<string, string | number | boolean>): void {
    if (!isBrowser() || !initialized) return
    try {
      LogRocket.track(eventName, properties)
    } catch (err) {
      console.error("[LogRocket] track failed", err)
    }
  },

  /** Records a page view. Call on initial mount and on every route change. `path` may include the query string. */
  trackPageView(path: string, pathname: string): void {
    if (!isBrowser() || !initialized) return
    logRocketManager.track("Page View", { path, page: getPageName(pathname) })
  },

  /** Records a click on a control, tagged with a running per-label click count for this session. */
  trackClick(label: string, properties?: Record<string, string | number | boolean>): void {
    if (!isBrowser() || !initialized) return
    const count = (clickCounts[label] = (clickCounts[label] ?? 0) + 1)
    logRocketManager.track("Click", { label, count, ...properties })
  },

  /** Resolves the shareable replay URL for the current session (e.g. to attach to a support ticket). */
  getSessionURL(callback: (url: string) => void): void {
    if (!isBrowser() || !initialized) return
    try {
      LogRocket.getSessionURL(callback)
    } catch (err) {
      console.error("[LogRocket] getSessionURL failed", err)
    }
  },
}
