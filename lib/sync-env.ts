export const SYNC_ENV = process.env.SYNC_ENV ?? "prod"

/** Returns the URL with `?env=<env>` / `&env=<env>` appended, or unchanged for prod. */
export function getUrlForEnv(url: string, env: string): string {
  if (env === "prod") return url
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}env=${env}`
}
