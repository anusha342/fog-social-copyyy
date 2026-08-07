export const SYNC_ENV = process.env.SYNC_ENV ?? "prod"

/** Returns the URL with `?env=<env>` / `&env=<env>` appended, or unchanged for prod. */
export function getUrlForEnv(url: string, env: string): string {
  if (env === "prod") return url
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}env=${env}`
}

// ── Shared memory offline tracker ─────────────────────────────────────────────

let isSyncOffline = false
let lastChecked = 0

export function getSyncOfflineStatus(): boolean {
  // Allow checking again after 5 minutes in case the sync server starts up
  if (isSyncOffline && Date.now() - lastChecked > 300000) {
    isSyncOffline = false
  }
  return isSyncOffline
}

export function setSyncOffline(offline: boolean) {
  isSyncOffline = offline
  lastChecked = Date.now()
}
