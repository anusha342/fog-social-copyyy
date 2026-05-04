import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      google_id: string
    } & DefaultSession["user"]
  }
}
